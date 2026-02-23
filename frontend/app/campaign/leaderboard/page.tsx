'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Github, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { VaraWallet } from '@/components/provn/VaraWallet';
import { Countdown } from '@/components/campaign/Countdown';
import { PrizeBanner } from '@/components/campaign/PrizeBanner';

interface LeaderboardEntry {
  rank: number;
  username: string;
  actor_id: string;
  score: number;
  tier: string;
  commits: number;
  repos: number;
  analyzed_at: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('score');
  const [order, setOrder] = useState('desc');

  const campaignEndDate = new Date('2025-12-01T00:00:00Z'); // Set your campaign end date

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/leaderboard/all?page=${page}&limit=20&sort=${sortBy}&order=${order}`
        );
        const data = await response.json();
        
        if (data.success) {
          setEntries(data.data.items);
          setTotalPages(data.data.pagination.total_pages);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        
        // Fallback to mock data
        const mockData: LeaderboardEntry[] = [
          {
            rank: 1,
            username: 'Adityaakr',
            actor_id: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            score: 44,
            tier: 'Emerging',
            commits: 73,
            repos: 13,
            analyzed_at: '2025-11-07T03:00:00Z',
          },
          {
            rank: 2,
            username: 'Satyam-10124',
            actor_id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            score: 35,
            tier: 'Emerging',
            commits: 120,
            repos: 25,
            analyzed_at: '2025-11-07T02:30:00Z',
          },
        ];
        setEntries(mockData);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [page, sortBy, order]);

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-provn-muted">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      {/* Header */}
      <header className="border-b border-provn-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-provn-accent">
            GrowStreams
          </Link>
          <VaraWallet />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 border-b border-provn-border bg-gradient-to-b from-provn-surface to-provn-bg">
        <div className="container mx-auto max-w-6xl text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
          <h1 className="text-5xl font-bold mb-4">Leaderboard</h1>
          <p className="text-xl text-provn-muted mb-6">
            Top Web3 contributors competing for prizes
          </p>
          <div className="flex gap-6 justify-center items-center text-sm">
            <div className="bg-provn-surface px-6 py-3 rounded-lg border border-provn-border">
              <div className="text-2xl font-bold text-provn-accent">{entries.length}</div>
              <div className="text-provn-muted">Participants</div>
            </div>
            <div className="bg-provn-surface px-6 py-3 rounded-lg border border-provn-border">
              <div className="text-2xl font-bold text-provn-accent">$2,500</div>
              <div className="text-provn-muted">Prize Pool</div>
            </div>
            <div className="bg-provn-surface px-6 py-3 rounded-lg border border-provn-border">
              <div className="text-2xl font-bold text-provn-accent">14d</div>
              <div className="text-provn-muted">Remaining</div>
            </div>
          </div>
        </div>
      </section>

      {/* Prize Banner */}
      <section className="py-8 px-4 border-b border-provn-border">
        <div className="container mx-auto max-w-6xl">
          <PrizeBanner totalPool="$2,500" />
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-provn-accent mx-auto mb-4"></div>
              <p className="text-provn-muted">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="bg-provn-surface rounded-lg border border-provn-border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-provn-surface-2 border-b border-provn-border font-semibold text-sm text-provn-muted">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">GitHub Username</div>
                <div className="col-span-2">Actor ID</div>
                <div className="col-span-1 text-center">Score</div>
                <div className="col-span-2 text-center">Tier</div>
                <div className="col-span-2 text-center">Activity</div>
              </div>

              {/* Table Rows */}
              {entries.map((entry, index) => (
                <Link
                  href={`/result/${entry.actor_id}`}
                  key={entry.actor_id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-provn-border hover:bg-provn-surface-2 transition-colors cursor-pointer ${
                    index < 3 ? 'bg-provn-accent/5' : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <Github className="w-4 h-4 text-provn-muted" />
                    <span className="text-provn-accent hover:underline font-medium">
                      {entry.username}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-xs text-provn-muted">
                      {entry.actor_id.substring(0, 10)}...
                    </span>
                  </div>
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="font-bold text-provn-accent text-lg">{entry.score}</span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center">
                    <span className="px-3 py-1 bg-provn-surface-2 border border-provn-border rounded-full text-xs font-medium">
                      {entry.tier}
                    </span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-3">
                    <div className="text-xs">
                      <div className="font-semibold text-provn-text">{entry.commits}</div>
                      <div className="text-provn-muted">commits</div>
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-provn-text">{entry.repos}</div>
                      <div className="text-provn-muted">repos</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-provn-surface-2 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-provn-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-provn-surface-2 transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Prize Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-provn-surface rounded-lg border border-provn-accent p-6">
              <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
              <h3 className="text-xl font-bold mb-2">Grand Prize</h3>
              <p className="text-3xl font-bold text-provn-accent mb-2">$1,000</p>
              <p className="text-sm text-provn-muted">Highest Overall Score</p>
            </div>
            <div className="bg-provn-surface rounded-lg border border-provn-border p-6">
              <Award className="w-8 h-8 text-provn-accent mb-3" />
              <h3 className="text-xl font-bold mb-2">Category Prizes</h3>
              <p className="text-3xl font-bold text-provn-accent mb-2">$300</p>
              <p className="text-sm text-provn-muted">Each: Impact, Quality, Collab, Security</p>
            </div>
            <div className="bg-provn-surface rounded-lg border border-provn-border p-6">
              <Medal className="w-8 h-8 text-provn-accent mb-3" />
              <h3 className="text-xl font-bold mb-2">Community Pick</h3>
              <p className="text-3xl font-bold text-provn-accent mb-2">$200</p>
              <p className="text-sm text-provn-muted">Most retweets (score ≥70)</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/campaign"
              className="inline-block px-8 py-4 bg-provn-accent hover:bg-provn-accent-press rounded-lg font-bold text-lg transition-colors"
            >
              Join the Challenge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
