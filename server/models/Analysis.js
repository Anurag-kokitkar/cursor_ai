const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bug', 'security', 'performance', 'style', 'complexity', 'maintainability', 'suggestion'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  message: String,
  file: {
    path: String,
    line: Number,
    column: Number,
    endLine: Number,
    endColumn: Number
  },
  rule: {
    id: String,
    name: String,
    category: String,
    documentation: String
  },
  suggestion: {
    fix: String,
    before: String,
    after: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['open', 'fixed', 'ignored', 'false_positive'],
    default: 'open'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    tool: String,
    version: String,
    cwe: [String], // Common Weakness Enumeration IDs
    tags: [String]
  }
});

const analysisSchema = new mongoose.Schema({
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['manual', 'webhook', 'scheduled', 'pull_request'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  branch: {
    type: String,
    default: 'main'
  },
  commit: {
    sha: String,
    message: String,
    author: String,
    timestamp: Date,
    url: String
  },
  pullRequest: {
    number: Number,
    title: String,
    author: String,
    url: String
  },
  scope: {
    files: [String],
    languages: [String],
    totalFiles: Number,
    totalLines: Number
  },
  configuration: {
    rules: {
      complexity: Boolean,
      security: Boolean,
      performance: Boolean,
      style: Boolean,
      bugs: Boolean,
      maintainability: Boolean
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'all'],
      default: 'medium'
    },
    excludePaths: [String],
    includePaths: [String]
  },
  results: {
    summary: {
      totalIssues: { type: Number, default: 0 },
      criticalIssues: { type: Number, default: 0 },
      highIssues: { type: Number, default: 0 },
      mediumIssues: { type: Number, default: 0 },
      lowIssues: { type: Number, default: 0 },
      filesAnalyzed: { type: Number, default: 0 },
      linesAnalyzed: { type: Number, default: 0 },
      score: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    issues: [issueSchema],
    metrics: {
      complexity: {
        average: Number,
        max: Number,
        files: [{
          path: String,
          complexity: Number
        }]
      },
      coverage: {
        percentage: Number,
        lines: {
          total: Number,
          covered: Number
        }
      },
      duplication: {
        percentage: Number,
        blocks: [{
          file: String,
          lines: String,
          duplicate: String
        }]
      }
    },
    suggestions: [{
      type: String,
      title: String,
      description: String,
      impact: String,
      effort: String,
      priority: Number
    }]
  },
  timing: {
    startTime: Date,
    endTime: Date,
    duration: Number, // in milliseconds
    phases: [{
      name: String,
      startTime: Date,
      endTime: Date,
      duration: Number
    }]
  },
  logs: [{
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  error: {
    message: String,
    stack: String,
    code: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analysisSchema.index({ repository: 1, createdAt: -1 });
analysisSchema.index({ triggeredBy: 1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'commit.sha': 1 });
analysisSchema.index({ 'pullRequest.number': 1 });

// Calculate analysis score based on issues
analysisSchema.methods.calculateScore = function() {
  const { results } = this;
  if (!results.summary.totalIssues) {
    this.results.summary.score = 100;
    return 100;
  }

  const weights = {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1
  };

  const weightedIssues = 
    (results.summary.criticalIssues * weights.critical) +
    (results.summary.highIssues * weights.high) +
    (results.summary.mediumIssues * weights.medium) +
    (results.summary.lowIssues * weights.low);

  const maxPossibleScore = results.summary.linesAnalyzed * 0.1; // Assume 1 issue per 10 lines is poor
  const score = Math.max(0, Math.min(100, 100 - (weightedIssues / Math.max(1, maxPossibleScore)) * 100));
  
  this.results.summary.score = Math.round(score);
  return this.results.summary.score;
};

// Update analysis progress
analysisSchema.methods.updateProgress = function(progress, phase) {
  this.progress = progress;
  if (phase) {
    this.logs.push({
      level: 'info',
      message: `Analysis phase: ${phase}`,
      metadata: { progress, phase }
    });
  }
  return this.save();
};

// Add issue to analysis
analysisSchema.methods.addIssue = function(issue) {
  this.results.issues.push(issue);
  
  // Update summary counts
  const severityField = `${issue.severity}Issues`;
  if (this.results.summary[severityField] !== undefined) {
    this.results.summary[severityField]++;
  }
  this.results.summary.totalIssues++;
  
  return this;
};

module.exports = mongoose.model('Analysis', analysisSchema);