const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const Repository = require('../models/Repository');
const AnalysisEngine = require('../services/AnalysisEngine');
const GitHubService = require('../services/GitHubService');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for analysis endpoints
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 analysis requests per windowMs
  message: 'Too many analysis requests, please try again later.',
  keyGenerator: (req) => req.user.id
});

const analysisEngine = new AnalysisEngine();
const githubService = new GitHubService();

// GET /api/analysis - Get user's analyses
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, repository, status } = req.query;
    
    const query = { triggeredBy: req.user.id };
    if (repository) query.repository = repository;
    if (status) query.status = status;

    const analyses = await Analysis.find(query)
      .populate('repository', 'name fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Analysis.countDocuments(query);

    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ message: 'Error fetching analyses', error: error.message });
  }
});

// GET /api/analysis/:id - Get specific analysis
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('repository', 'name fullName owner')
      .populate('triggeredBy', 'username email');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Check if user has access to this analysis
    if (analysis.triggeredBy._id.toString() !== req.user.id && 
        analysis.repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Error fetching analysis', error: error.message });
  }
});

// POST /api/analysis - Start new analysis
router.post('/', auth, analysisLimiter, async (req, res) => {
  try {
    const { repositoryId, branch, type = 'manual', configuration } = req.body;

    // Validate repository access
    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to repository' });
    }

    // Create analysis record
    const analysis = new Analysis({
      repository: repositoryId,
      triggeredBy: req.user.id,
      type,
      branch: branch || repository.defaultBranch,
      status: 'pending',
      configuration: {
        ...repository.analysisSettings,
        ...configuration
      }
    });

    await analysis.save();

    // Start analysis in background
    startAnalysis(analysis._id, req.user, repository);

    // Emit real-time update
    req.io.to(`analysis-${analysis._id}`).emit('analysisStarted', {
      analysisId: analysis._id,
      status: 'pending'
    });

    res.status(201).json({ 
      message: 'Analysis started',
      analysisId: analysis._id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ message: 'Error starting analysis', error: error.message });
  }
});

// PUT /api/analysis/:id/cancel - Cancel running analysis
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('repository', 'owner');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Check access
    if (analysis.triggeredBy.toString() !== req.user.id && 
        analysis.repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (analysis.status !== 'pending' && analysis.status !== 'running') {
      return res.status(400).json({ message: 'Analysis cannot be cancelled' });
    }

    analysis.status = 'cancelled';
    analysis.timing.endTime = new Date();
    analysis.timing.duration = analysis.timing.endTime - analysis.timing.startTime;
    
    await analysis.save();

    // Emit real-time update
    req.io.to(`analysis-${analysis._id}`).emit('analysisUpdated', {
      analysisId: analysis._id,
      status: 'cancelled'
    });

    res.json({ message: 'Analysis cancelled', status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling analysis:', error);
    res.status(500).json({ message: 'Error cancelling analysis', error: error.message });
  }
});

// GET /api/analysis/:id/issues - Get analysis issues
router.get('/:id/issues', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, type, status } = req.query;
    
    const analysis = await Analysis.findById(req.params.id)
      .populate('repository', 'owner');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Check access
    if (analysis.triggeredBy.toString() !== req.user.id && 
        analysis.repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let issues = analysis.results.issues;

    // Apply filters
    if (severity) {
      issues = issues.filter(issue => issue.severity === severity);
    }
    if (type) {
      issues = issues.filter(issue => issue.type === type);
    }
    if (status) {
      issues = issues.filter(issue => issue.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedIssues = issues.slice(startIndex, endIndex);

    res.json({
      issues: paginatedIssues,
      totalPages: Math.ceil(issues.length / limit),
      currentPage: parseInt(page),
      total: issues.length,
      summary: analysis.results.summary
    });
  } catch (error) {
    console.error('Error fetching analysis issues:', error);
    res.status(500).json({ message: 'Error fetching issues', error: error.message });
  }
});

// PUT /api/analysis/:id/issues/:issueId - Update issue status
router.put('/:id/issues/:issueId', auth, async (req, res) => {
  try {
    const { status, assignee, comment } = req.body;
    
    const analysis = await Analysis.findById(req.params.id)
      .populate('repository', 'owner');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Check access
    if (analysis.triggeredBy.toString() !== req.user.id && 
        analysis.repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const issue = analysis.results.issues.id(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update issue
    if (status) issue.status = status;
    if (assignee) issue.assignee = assignee;
    
    if (comment) {
      issue.comments.push({
        author: req.user.id,
        content: comment
      });
    }

    await analysis.save();

    res.json({ message: 'Issue updated', issue });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
});

// GET /api/analysis/stats - Get analysis statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const pipeline = [
      { $match: { triggeredBy: req.user._id, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          totalIssues: { $sum: '$results.summary.totalIssues' },
          totalFiles: { $sum: '$results.summary.filesAnalyzed' },
          totalLines: { $sum: '$results.summary.linesAnalyzed' },
          avgScore: { $avg: '$results.summary.score' },
          criticalIssues: { $sum: '$results.summary.criticalIssues' },
          highIssues: { $sum: '$results.summary.highIssues' },
          mediumIssues: { $sum: '$results.summary.mediumIssues' },
          lowIssues: { $sum: '$results.summary.lowIssues' }
        }
      }
    ];

    const stats = await Analysis.aggregate(pipeline);
    
    res.json(stats[0] || {
      totalAnalyses: 0,
      totalIssues: 0,
      totalFiles: 0,
      totalLines: 0,
      avgScore: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    });
  } catch (error) {
    console.error('Error fetching analysis stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Background analysis function
async function startAnalysis(analysisId, user, repository) {
  try {
    const analysis = await Analysis.findById(analysisId);
    if (!analysis) return;

    analysis.status = 'running';
    analysis.timing.startTime = new Date();
    await analysis.save();

    // Emit real-time update
    analysis.logs.push({
      level: 'info',
      message: 'Analysis started'
    });

    // Get repository content from GitHub
    const githubService = new GitHubService();
    const [owner, repo] = repository.fullName.split('/');
    
    // Get repository tree
    const files = await githubService.getRepositoryTree(
      user.githubAccessToken,
      owner,
      repo,
      analysis.branch,
      true
    );

    analysis.scope.totalFiles = files.length;
    analysis.progress = 10;
    await analysis.save();

    // Filter files based on configuration
    const sourceFiles = files.filter(file => {
      const language = analysisEngine.getLanguageFromFile(file.path);
      return language && 
        (!analysis.configuration.excludePaths.length || 
         !analysis.configuration.excludePaths.some(pattern => file.path.includes(pattern)));
    });

    analysis.scope.files = sourceFiles.map(f => f.path);
    analysis.scope.languages = [...new Set(sourceFiles.map(f => analysisEngine.getLanguageFromFile(f.path)))];
    analysis.progress = 20;
    await analysis.save();

    let totalLines = 0;
    let processedFiles = 0;

    // Analyze each file
    for (const file of sourceFiles) {
      if (analysis.status === 'cancelled') break;

      try {
        const fileContent = await githubService.getFileContent(
          user.githubAccessToken,
          owner,
          repo,
          file.path,
          analysis.branch
        );

        const language = analysisEngine.getLanguageFromFile(file.path);
        const fileAnalysis = await analysisEngine.analyzeFile(
          file.path,
          fileContent.content,
          language
        );

        // Add issues to analysis
        fileAnalysis.issues.forEach(issue => {
          analysis.addIssue(issue);
        });

        totalLines += fileAnalysis.metrics.lines;
        processedFiles++;

        // Update progress
        analysis.progress = 20 + Math.floor((processedFiles / sourceFiles.length) * 70);
        analysis.scope.totalLines = totalLines;
        analysis.results.summary.filesAnalyzed = processedFiles;
        analysis.results.summary.linesAnalyzed = totalLines;

        if (processedFiles % 10 === 0) {
          await analysis.save();
        }
      } catch (error) {
        console.error(`Error analyzing file ${file.path}:`, error);
        analysis.logs.push({
          level: 'error',
          message: `Error analyzing file ${file.path}: ${error.message}`
        });
      }
    }

    if (analysis.status !== 'cancelled') {
      // Calculate final metrics
      analysis.calculateScore();
      analysis.status = 'completed';
      analysis.progress = 100;
      analysis.timing.endTime = new Date();
      analysis.timing.duration = analysis.timing.endTime - analysis.timing.startTime;

      // Update repository statistics
      await repository.updateStats({
        issuesCount: analysis.results.summary.totalIssues,
        linesAnalyzed: analysis.results.summary.linesAnalyzed,
        duration: analysis.timing.duration
      });
    }

    await analysis.save();

    // Emit completion event
    global.io?.to(`analysis-${analysisId}`).emit('analysisCompleted', {
      analysisId,
      status: analysis.status,
      summary: analysis.results.summary
    });

  } catch (error) {
    console.error('Error in background analysis:', error);
    
    const analysis = await Analysis.findById(analysisId);
    if (analysis) {
      analysis.status = 'failed';
      analysis.error = {
        message: error.message,
        stack: error.stack
      };
      analysis.timing.endTime = new Date();
      analysis.timing.duration = analysis.timing.endTime - analysis.timing.startTime;
      await analysis.save();

      global.io?.to(`analysis-${analysisId}`).emit('analysisFailed', {
        analysisId,
        error: error.message
      });
    }
  }
}

module.exports = router;