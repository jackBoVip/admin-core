/**
 * 锁屏时间显示组件
 * @description 独立组件，避免时间更新导致整个锁屏重渲染
 */
import React, { memo, useState, useEffect, useMemo } from 'react';

export interface LockScreenTimeProps {
  /** 当前语言 */
  locale: string;
}

export const LockScreenTime: React.FC<LockScreenTimeProps> = memo(({ locale }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 定时更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 缓存 DateTimeFormat 实例
  const dateFormatter = useMemo(() => ({
    date: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
  }), [locale]);

  const timeInfo = useMemo(() => ({
    hour24: currentTime.getHours().toString().padStart(2, '0'),
    minute: currentTime.getMinutes().toString().padStart(2, '0'),
    second: currentTime.getSeconds().toString().padStart(2, '0'),
    dateStr: dateFormatter.date.format(currentTime),
    weekdayStr: dateFormatter.weekday.format(currentTime),
  }), [currentTime, dateFormatter]);

  return (
    <>
      <div className="preferences-lock-time-main">
        <span className="preferences-lock-time-hours">{timeInfo.hour24}</span>
        <span className="preferences-lock-time-divider" aria-hidden="true">:</span>
        <span className="preferences-lock-time-minutes">{timeInfo.minute}</span>
        <span className="preferences-lock-time-seconds">{timeInfo.second}</span>
      </div>
      <div className="preferences-lock-time-info">
        <span className="preferences-lock-time-weekday">{timeInfo.weekdayStr}</span>
        <span className="preferences-lock-time-divider-dot" aria-hidden="true"></span>
        <span className="preferences-lock-time-date">{timeInfo.dateStr}</span>
      </div>
    </>
  );
});

LockScreenTime.displayName = 'LockScreenTime';

export default LockScreenTime;
