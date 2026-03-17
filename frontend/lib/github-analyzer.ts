/**
 * GrowStreams GitHub AI On-Chain Engine
 * Phase 2: Enhanced Web3 Scoring System
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface RepoContribution {
  name: string;
  trust: number;
  commits: number;
  is_maintainer: boolean;
  ecosystem: string[];
  stars: number;
  forks: number;
}

interface Web3Scores {
  overall_web3: number;
  impact: number;
  quality: number;
  collaboration: number;
  security: number;
}

interface AnalysisResult {
  username: string;
  scores: Web3Scores;
  tier: string;
  repo_contributions: RepoContribution[];
  total_repos_analyzed: number;
  prs_merged: number;
  commits_made: number;
  explanations: {
    impact: string;
    quality: string;
    collaboration: string;
    security: string;
  };
  bonuses_applied: string[];
  analyzed_at: string;
}

// Ecosystem detection patterns
const ECOSYSTEM_PATTERNS = {
  web3: ['web3', 'blockchain', 'crypto', 'defi', 'nft', 'dao', 'dapp'],
  vara: ['vara', 'gear', 'polkadot', 'substrate'],
  ai: ['ai', 'ml', 'machine-learning', 'neural', 'gpt', 'llm', 'model'],
  framework: ['react', 'next', 'vue', 'angular', 'node', 'express'],
  defi: ['defi', 'swap', 'lending', 'yield', 'liquidity', 'amm'],
  dao: ['dao', 'governance', 'voting', 'proposal'],
  devrel: ['tutorial', 'example', 'demo', 'starter', 'template', 'docs'],
};

function detectEcosystems(repoName: string, description: string = ''): string[] {
  const text = `${repoName} ${description}`.toLowerCase();
  const ecosystems: string[] = [];

  for (const [ecosystem, patterns] of Object.entries(ECOSYSTEM_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      ecosystems.push(ecosystem);
    }
  }

  return ecosystems;
}

function calculateTrust(stars: number, forks: number): number {
  // Trust = log10(stars + 1) * 10 + log10(forks + 1) * 5
  // Max ~100 for very popular repos
  const starScore = Math.log10(stars + 1) * 10;
  const forkScore = Math.log10(forks + 1) * 5;
  return Math.min(100, starScore + forkScore);
}

function getTier(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Expert';
  if (score >= 40) return 'Advanced';
  if (score >= 20) return 'Intermediate';
  return 'Beginner';
}

async function fetchGitHubData(username: string, windowDays: number = 180) {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - windowDays);
  const since = sinceDate.toISOString();

  // Fetch user repos
  const reposResponse = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers, next: { revalidate: 300 } } // Cache for 5 minutes
  );

  if (!reposResponse.ok) {
    throw new Error(`GitHub API error: ${reposResponse.status}`);
  }

  const repos = await reposResponse.json();

  // Fetch user events (commits, PRs)
  const eventsResponse = await fetch(
    `https://api.github.com/users/${username}/events?per_page=100`,
    { headers, next: { revalidate: 300 } }
  );

  const events = eventsResponse.ok ? await eventsResponse.json() : [];

  return { repos, events };
}

export async function analyzeGitHubUser(
  githubUsername: string,
  windowDays: number = 180
): Promise<AnalysisResult> {
  try {
    // Fetch data from GitHub
    const { repos, events } = await fetchGitHubData(githubUsername, windowDays);

    // Filter for recent activity
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - windowDays);

    // Process repos
    const repoContributions: RepoContribution[] = repos
      .filter((repo: any) => {
        const updatedAt = new Date(repo.updated_at);
        return updatedAt >= sinceDate;
      })
      .map((repo: any) => {
        const isMaintainer = repo.owner.login === githubUsername;
        const ecosystems = detectEcosystems(repo.name, repo.description || '');
        const trust = calculateTrust(repo.stargazers_count, repo.forks_count);

        return {
          name: repo.full_name,
          trust,
          commits: 0, // Will be updated from events
          is_maintainer: isMaintainer,
          ecosystem: ecosystems,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        };
      });

    // Count commits from events
    const commitEvents = events.filter((e: any) => e.type === 'PushEvent');
    let totalCommits = 0;

    commitEvents.forEach((event: any) => {
      const repoName = event.repo.name;
      const commits = event.payload?.commits?.length || 0;
      totalCommits += commits;

      const repo = repoContributions.find(r => r.name === repoName);
      if (repo) {
        repo.commits += commits;
      }
    });

    // Count merged PRs
    const prEvents = events.filter((e: any) => 
      e.type === 'PullRequestEvent' && e.payload?.pull_request?.merged_at
    );
    const prsMerged = prEvents.length;

    // Calculate scores
    const bonuses: string[] = [];

    // 1. Impact Score (0-100)
    let impactScore = 0;
    const maintainerRepos = repoContributions.filter(r => r.is_maintainer);
    const maintainerMultiplier = maintainerRepos.length > 0 ? 2 : 1;

    if (maintainerRepos.length > 0) {
      bonuses.push(`Maintainer 2x multiplier (${maintainerRepos.length} repos)`);
    }

    // Base impact from trust-weighted commits
    repoContributions.forEach(repo => {
      const trustWeight = Math.sqrt(repo.trust); // Exponential trust weighting
      const commitScore = repo.commits * trustWeight;
      impactScore += commitScore * (repo.is_maintainer ? 2 : 1);
    });

    // Normalize impact score
    impactScore = Math.min(100, impactScore / 10);

    // Ecosystem bonuses
    const uniqueEcosystems = new Set(
      repoContributions.flatMap(r => r.ecosystem)
    );

    if (uniqueEcosystems.has('web3')) {
      impactScore += 5;
      bonuses.push('Web3 ecosystem bonus (+5)');
    }
    if (uniqueEcosystems.has('defi')) {
      impactScore += 5;
      bonuses.push('DeFi ecosystem bonus (+5)');
    }
    if (uniqueEcosystems.has('dao')) {
      impactScore += 3;
      bonuses.push('DAO ecosystem bonus (+3)');
    }
    if (uniqueEcosystems.has('vara')) {
      impactScore += 10;
      bonuses.push('Vara Network bonus (+10)');
    }

    // Cross-ecosystem bonus
    if (uniqueEcosystems.size >= 3) {
      impactScore += 10;
      bonuses.push(`Cross-ecosystem bonus (+10, ${uniqueEcosystems.size} domains)`);
    }

    // 2. Quality Score (0-100)
    const avgStars = repoContributions.reduce((sum, r) => sum + r.stars, 0) / Math.max(repoContributions.length, 1);
    const qualityScore = Math.min(100, (avgStars / 10) * 20 + (prsMerged * 5));

    // 3. Collaboration Score (0-100)
    const externalRepos = repoContributions.filter(r => !r.is_maintainer).length;
    const collaborationScore = Math.min(100, externalRepos * 10 + prsMerged * 3);

    // 4. Security Score (0-100)
    const highTrustRepos = repoContributions.filter(r => r.trust > 50).length;
    const securityScore = Math.min(100, highTrustRepos * 15);

    // Overall Web3 Score (weighted average)
    const overallScore = Math.round(
      impactScore * 0.4 +
      qualityScore * 0.25 +
      collaborationScore * 0.2 +
      securityScore * 0.15
    );

    const scores: Web3Scores = {
      overall_web3: Math.min(100, overallScore),
      impact: Math.round(Math.min(100, impactScore)),
      quality: Math.round(qualityScore),
      collaboration: Math.round(collaborationScore),
      security: Math.round(securityScore),
    };

    return {
      username: githubUsername,
      scores,
      tier: getTier(scores.overall_web3),
      repo_contributions: repoContributions.sort((a, b) => b.commits - a.commits),
      total_repos_analyzed: repoContributions.length,
      prs_merged: prsMerged,
      commits_made: totalCommits,
      explanations: {
        impact: `Impact based on ${totalCommits} commits across ${repoContributions.length} repos with ${maintainerRepos.length} maintainer repos (2x multiplier)`,
        quality: `Quality score from ${Math.round(avgStars)} avg stars and ${prsMerged} merged PRs`,
        collaboration: `Collaboration across ${externalRepos} external repos with ${prsMerged} merged contributions`,
        security: `Security from ${highTrustRepos} high-trust repositories (>50 trust score)`,
      },
      bonuses_applied: bonuses,
      analyzed_at: new Date().toISOString(),
    };

  } catch (error) {
    console.error('GitHub analysis error:', error);
    throw new Error(`Failed to analyze GitHub user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
