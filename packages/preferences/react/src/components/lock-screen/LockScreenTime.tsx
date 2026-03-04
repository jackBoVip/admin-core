/**
 * 锁屏时间显示组件
 * @description 独立组件，避免时间更新导致整个锁屏重渲染
 */
import React, { memo, useState, useEffect, useMemo } from 'react';

/**
 * 锁屏时间组件参数。
 */
export interface LockScreenTimeProps {
  /** 当前语言 */
  locale: string;
}

/**
 * 锁屏时间显示组件。
 */
export const LockScreenTime: React.FC<LockScreenTimeProps> = memo(({ locale }) => {
  /**
   * 当前时间状态快照。
   */
  const [currentTime, setCurrentTime] = useState(new Date());

  /**
   * 启动秒级定时器刷新当前时间。
   * @description 组件卸载时清理定时器，避免内存泄漏。
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * 缓存日期与星期格式化器。
   * @description 仅在语言变更时重建，减少渲染期开销。
   */
  const dateFormatter = useMemo(() => ({
    date: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
  }), [locale]);

  /**
   * 当前时间展示结构。
   * @description 预先格式化显示字段，减少模板内重复计算。
   */
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

/**
 * 默认导出锁屏时间组件。
 */
export default LockScreenTime;
