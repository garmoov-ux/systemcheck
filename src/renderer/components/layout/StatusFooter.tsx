import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="h-[26px] bg-[#e2e8f0]/70 border-t border-[#cbd5e1] px-4 flex items-center justify-between text-[11px] text-[#475569] whitespace-nowrap shrink-0 select-none">
      <div className="flex items-center gap-2">
        <strong className="font-semibold text-[#0f172a]">
          SystemCheck 무인교통단속장비 상태 점검기 2.1
        </strong>
        <span>·</span>
        <span>ICMP 응답 확인 · 원격 데스크톱(3389) · 원격 제어(5900) · 센터 생존신호</span>
      </div>
      <div>개발·기술지원: ㈜이노네트웍스 강홍선</div>
    </footer>
  );
};
