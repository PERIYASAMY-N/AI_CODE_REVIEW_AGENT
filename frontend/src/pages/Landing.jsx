import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Zap, Shield, GitPullRequest } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center pt-24 pb-20">
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
            Elevate Your Code Quality with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              AI-Powered Reviews
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Automate your PR feedback, catch bugs before they merge, and accelerate your
            development cycle with multi-LLM intelligent code analysis.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-medium rounded-xl transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="bg-gray-800 border border-gray-700 hover:border-blue-500/50 p-8 rounded-2xl transition">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
              <Zap className="text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Instant Feedback</h3>
            <p className="text-gray-400">
              Receive comprehensive code reviews within seconds. Bugs, security issues,
              and optimizations — all in one structured report.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 hover:border-purple-500/50 p-8 rounded-2xl transition">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30">
              <Code className="text-purple-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Multi-LLM Engine</h3>
            <p className="text-gray-400">
              Powered by Groq-hosted Llama 3.3 70B, Llama 3.1 70B, and Mixtral 8x7B
              for fast, accurate, and diverse insights.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 p-8 rounded-2xl transition">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Shield className="text-emerald-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Secure & Private</h3>
            <p className="text-gray-400">
              JWT-authenticated sessions, rate limiting, and no code retention —
              your intellectual property stays yours.
            </p>
          </div>
        </div>

        {/* Screenshots */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">See It In Action</h2>
            <p className="text-gray-400">A clean, intuitive interface built for developers who move fast.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-2">
              <img
                src="/dashboard_mockup.png"
                alt="Dashboard"
                className="w-full h-auto rounded-xl shadow-2xl"
                loading="lazy"
              />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-2">
              <img
                src="/code_review_mockup.png"
                alt="Code Review Interface"
                className="w-full h-auto rounded-xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-gray-700 py-16 px-8 rounded-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to ship better code faster?</h2>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg text-lg"
          >
            Create your account <GitPullRequest className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Landing;
