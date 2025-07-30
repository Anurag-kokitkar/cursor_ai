const { Octokit } = require('@octokit/rest');
const axios = require('axios');

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_CLIENT_SECRET
    });
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  }

  // Create authenticated Octokit instance for user
  getUserOctokit(accessToken) {
    return new Octokit({
      auth: accessToken
    });
  }

  // Get user repositories
  async getUserRepositories(accessToken, options = {}) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        per_page: options.per_page || 30,
        page: options.page || 1,
        type: options.type || 'all'
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        isPrivate: repo.private,
        language: repo.language,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        homepage: repo.homepage,
        size: repo.size,
        stargazersCount: repo.stargazers_count,
        watchersCount: repo.watchers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  // Get repository languages
  async getRepositoryLanguages(accessToken, owner, repo) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.repos.listLanguages({
        owner,
        repo
      });
      return data;
    } catch (error) {
      console.error('Error fetching repository languages:', error);
      return {};
    }
  }

  // Get repository content
  async getRepositoryContent(accessToken, owner, repo, path = '', ref = null) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const params = { owner, repo, path };
      if (ref) params.ref = ref;
      
      const { data } = await octokit.rest.repos.getContent(params);
      return data;
    } catch (error) {
      console.error('Error fetching repository content:', error);
      throw error;
    }
  }

  // Get file content
  async getFileContent(accessToken, owner, repo, path, ref = null) {
    try {
      const content = await this.getRepositoryContent(accessToken, owner, repo, path, ref);
      
      if (content.type === 'file') {
        const decoded = Buffer.from(content.content, 'base64').toString('utf-8');
        return {
          content: decoded,
          sha: content.sha,
          size: content.size,
          path: content.path
        };
      }
      
      throw new Error('Path is not a file');
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  // Get repository tree (for getting all files)
  async getRepositoryTree(accessToken, owner, repo, sha = null, recursive = true) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      // Get default branch if sha not provided
      if (!sha) {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        sha = repoData.default_branch;
      }

      const { data } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: recursive ? 'true' : 'false'
      });

      return data.tree.filter(item => item.type === 'blob'); // Only return files
    } catch (error) {
      console.error('Error fetching repository tree:', error);
      throw error;
    }
  }

  // Create webhook
  async createWebhook(accessToken, owner, repo, webhookUrl) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: this.webhookSecret,
          insecure_ssl: '0'
        },
        events: ['push', 'pull_request', 'repository'],
        active: true
      });

      return {
        id: data.id,
        url: data.config.url,
        events: data.events,
        active: data.active
      };
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  // Update webhook
  async updateWebhook(accessToken, owner, repo, webhookId, config) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.repos.updateWebhook({
        owner,
        repo,
        hook_id: webhookId,
        config: {
          url: config.url,
          content_type: 'json',
          secret: this.webhookSecret,
          insecure_ssl: '0'
        },
        events: config.events || ['push', 'pull_request', 'repository'],
        active: config.active !== undefined ? config.active : true
      });

      return data;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  // Delete webhook
  async deleteWebhook(accessToken, owner, repo, webhookId) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: webhookId
      });
      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  // Get pull request
  async getPullRequest(accessToken, owner, repo, pullNumber) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state,
        author: data.user.login,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        mergedAt: data.merged_at,
        url: data.html_url,
        head: {
          ref: data.head.ref,
          sha: data.head.sha,
          repo: data.head.repo ? data.head.repo.full_name : null
        },
        base: {
          ref: data.base.ref,
          sha: data.base.sha,
          repo: data.base.repo.full_name
        },
        commits: data.commits,
        additions: data.additions,
        deletions: data.deletions,
        changedFiles: data.changed_files
      };
    } catch (error) {
      console.error('Error fetching pull request:', error);
      throw error;
    }
  }

  // Get pull request files
  async getPullRequestFiles(accessToken, owner, repo, pullNumber) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber
      });

      return data.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        sha: file.sha,
        previousFilename: file.previous_filename
      }));
    } catch (error) {
      console.error('Error fetching pull request files:', error);
      throw error;
    }
  }

  // Create pull request comment
  async createPullRequestComment(accessToken, owner, repo, pullNumber, body, commitSha = null, path = null, line = null) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      let commentData;
      
      if (path && line && commitSha) {
        // Create review comment (line-specific)
        commentData = await octokit.rest.pulls.createReviewComment({
          owner,
          repo,
          pull_number: pullNumber,
          body,
          commit_id: commitSha,
          path,
          line
        });
      } else {
        // Create general comment
        commentData = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pullNumber,
          body
        });
      }

      return commentData.data;
    } catch (error) {
      console.error('Error creating pull request comment:', error);
      throw error;
    }
  }

  // Create commit status
  async createCommitStatus(accessToken, owner, repo, sha, state, context, description, targetUrl = null) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const params = {
        owner,
        repo,
        sha,
        state, // 'pending', 'success', 'error', 'failure'
        context,
        description
      };
      
      if (targetUrl) {
        params.target_url = targetUrl;
      }

      const { data } = await octokit.rest.repos.createCommitStatus(params);
      return data;
    } catch (error) {
      console.error('Error creating commit status:', error);
      throw error;
    }
  }

  // Get commit
  async getCommit(accessToken, owner, repo, sha) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha
      });

      return {
        sha: data.sha,
        message: data.commit.message,
        author: {
          name: data.commit.author.name,
          email: data.commit.author.email,
          date: data.commit.author.date,
          login: data.author ? data.author.login : null
        },
        committer: {
          name: data.commit.committer.name,
          email: data.commit.committer.email,
          date: data.commit.committer.date,
          login: data.committer ? data.committer.login : null
        },
        url: data.html_url,
        files: data.files ? data.files.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch
        })) : [],
        stats: data.stats
      };
    } catch (error) {
      console.error('Error fetching commit:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Parse webhook payload
  parseWebhookPayload(headers, body) {
    const event = headers['x-github-event'];
    const signature = headers['x-hub-signature-256'];
    const delivery = headers['x-github-delivery'];

    if (!this.verifyWebhookSignature(JSON.stringify(body), signature)) {
      throw new Error('Invalid webhook signature');
    }

    const payload = {
      event,
      delivery,
      action: body.action,
      repository: body.repository ? {
        id: body.repository.id,
        name: body.repository.name,
        fullName: body.repository.full_name,
        owner: body.repository.owner.login,
        isPrivate: body.repository.private,
        defaultBranch: body.repository.default_branch
      } : null
    };

    switch (event) {
      case 'push':
        payload.push = {
          ref: body.ref,
          before: body.before,
          after: body.after,
          commits: body.commits.map(commit => ({
            id: commit.id,
            message: commit.message,
            author: commit.author,
            url: commit.url,
            added: commit.added,
            removed: commit.removed,
            modified: commit.modified
          })),
          headCommit: body.head_commit ? {
            id: body.head_commit.id,
            message: body.head_commit.message,
            author: body.head_commit.author,
            url: body.head_commit.url
          } : null
        };
        break;

      case 'pull_request':
        payload.pullRequest = {
          number: body.pull_request.number,
          title: body.pull_request.title,
          body: body.pull_request.body,
          state: body.pull_request.state,
          author: body.pull_request.user.login,
          url: body.pull_request.html_url,
          head: {
            ref: body.pull_request.head.ref,
            sha: body.pull_request.head.sha
          },
          base: {
            ref: body.pull_request.base.ref,
            sha: body.pull_request.base.sha
          }
        };
        break;
    }

    return payload;
  }

  // OAuth URL generation
  getOAuthUrl(clientId, redirectUri, scopes = ['repo']) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: this.generateRandomState()
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(clientId, clientSecret, code) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Get authenticated user
  async getAuthenticatedUser(accessToken) {
    const octokit = this.getUserOctokit(accessToken);
    
    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        id: data.id,
        login: data.login,
        name: data.name,
        email: data.email,
        avatar: data.avatar_url,
        bio: data.bio,
        company: data.company,
        location: data.location,
        blog: data.blog,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      throw error;
    }
  }

  generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

module.exports = GitHubService;