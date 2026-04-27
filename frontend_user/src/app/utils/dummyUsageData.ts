import { format, eachDayOfInterval, parseISO } from 'date-fns';

/**
 * 4월 1일부터 현재(또는 지정된 날짜)까지의 일별 더미 데이터를 생성해 반환합니다.
 */
export const getDummyUsageStats = () => {
  // 4월 1일 고정 시작일
  const startDate = parseISO('2026-04-01');
  const endDate = new Date(); // 오늘까지

  // 4/1 부터 오늘까지의 모든 날짜 생성
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const daily_stats = days.map((dateStr) => {
    // 날짜별로 시뮬레이션용 데이터 생성 (단순 계산식 활용)
    const seed = dateStr.getDate();
    return {
      date: format(dateStr, 'yyyy-MM-dd'),
      calls: 100 + (seed * 23) % 150,
      tokens: 200000 + (seed * 12345) % 250000
    };
  });

  const total_calls = daily_stats.reduce((acc, curr) => acc + curr.calls, 0);
  const total_tokens = daily_stats.reduce((acc, curr) => acc + curr.tokens, 0);

  return {
    success: true,
    total_calls,
    total_tokens,
    daily_stats
  };
};
