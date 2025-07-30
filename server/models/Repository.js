const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    unique: true
  },
  githubId: {
    type: Number,
    required: true,
    unique: true
  },
  description: String,
  isPrivate: {
    type: Boolean,
    default: false
  },
  language: String,
  languages: {
    type: Map,
    of: Number,
    default: new Map()
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  url: String,
  cloneUrl: String,
  sshUrl: String,
  homepage: String,
  size: Number,
  stargazersCount: {
    type: Number,
    default: 0
  },
  watchersCount: {
    type: Number,
    default: 0
  },
  forksCount: {
    type: Number,
    default: 0
  },
  openIssuesCount: {
    type: Number,
    default: 0
  },
  webhookId: Number,
  webhookUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  analysisSettings: {
    autoReview: {
      type: Boolean,
      default: false
    },
    reviewOnPush: {
      type: Boolean,
      default: true
    },
    reviewOnPR: {
      type: Boolean,
      default: true
    },
    languages: [String],
    excludePaths: [String],
    includePaths: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'all'],
      default: 'medium'
    },
    rules: {
      complexity: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      performance: { type: Boolean, default: true },
      style: { type: Boolean, default: false },
      bugs: { type: Boolean, default: true },
      maintainability: { type: Boolean, default: true }
    }
  },
  statistics: {
    totalAnalyses: { type: Number, default: 0 },
    lastAnalysis: Date,
    totalIssues: { type: Number, default: 0 },
    resolvedIssues: { type: Number, default: 0 },
    avgAnalysisTime: { type: Number, default: 0 },
    linesAnalyzed: { type: Number, default: 0 }
  },
  lastSync: Date,
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
repositorySchema.index({ owner: 1, name: 1 });
repositorySchema.index({ githubId: 1 });
repositorySchema.index({ fullName: 1 });
repositorySchema.index({ isActive: 1 });

// Update repository statistics
repositorySchema.methods.updateStats = function(analysisData) {
  this.statistics.totalAnalyses += 1;
  this.statistics.lastAnalysis = new Date();
  this.statistics.totalIssues += analysisData.issuesCount || 0;
  this.statistics.linesAnalyzed += analysisData.linesAnalyzed || 0;
  
  if (analysisData.duration) {
    const currentAvg = this.statistics.avgAnalysisTime;
    const count = this.statistics.totalAnalyses;
    this.statistics.avgAnalysisTime = ((currentAvg * (count - 1)) + analysisData.duration) / count;
  }
  
  return this.save();
};

module.exports = mongoose.model('Repository', repositorySchema);