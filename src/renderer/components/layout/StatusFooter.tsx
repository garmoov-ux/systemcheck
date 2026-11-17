import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="h-[32px] bg-[#f5f5f7] border-t border-[#e0e0e0] px-5 flex items-center justify-between text-[12px] text-[#7a7a7a] whitespace-nowrap shrink-0 select-none">
      <div className="flex items-center gap-2">
        <strong className="font-semibold text-[#333333]">무인교통단속장비 상태 점검기 2.0</strong>
        <span>·</span>
        <span>원격 제어 및 센터 생존신호 연동 시스템</span>
      </div>
      <div>개발·기술지원: ㈜이노네트웍스 강홍선</div>
    </footer>
  );
};
