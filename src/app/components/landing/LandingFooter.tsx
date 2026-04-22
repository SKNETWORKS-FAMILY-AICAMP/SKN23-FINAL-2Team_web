/*
File    : src/app/components/landing/LandingFooter.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 랜딩 페이지 하단 푸터 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-20 px-8 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="space-y-6">
          <div className="text-xl font-black tracking-tighter text-white">CADENCE AI</div>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            건축과 인공지능의 만남. 더 정확하고 빠른 설계를 위한 차세대 CAD 플랫폼.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Platform</h5>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Company</h5>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
        <div>© 2026 CADENCE AI. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};
