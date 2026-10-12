import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-black text-zinc-400 border-t border-zinc-800 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blood-600 inline-block" />
            <span className="font-extrabold text-white text-sm uppercase tracking-wider">
              BloodChain Verification Engine
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
            Decentralized blood bag traceability and custody verification framework powered by Solidity 0.8.34, Hardhat 3, Ethers.js v6, and MongoDB Atlas.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
            Authoritative Roles
          </h4>
          <ul className="space-y-1.5 text-zinc-400 text-xs font-mono">
            <li>ADMIN: System Governance</li>
            <li>BLOOD_BANK: Bag Registration & Transit</li>
            <li>LAB: Serology Testing & Approval</li>
            <li>HOSPITAL: Receipt & Transfusion</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
            Ledger Specification
          </h4>
          <ul className="space-y-1.5 text-zinc-400 text-xs font-mono">
            <li>Network: Hardhat Local / EDR</li>
            <li>Port: 8545</li>
            <li>Immutable Event History: On-Chain</li>
            <li>PII Isolation: Enforced</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[11px]">
        <span>BloodChain — College DLT Project (Semester 7)</span>
        <span className="mt-2 sm:mt-0 font-mono">Authoritative Smart Contract Architecture</span>
      </div>
    </footer>
  );
};
