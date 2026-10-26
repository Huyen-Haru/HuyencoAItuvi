declare module 'lunar-javascript' {
  class LunarTime {
    getZhi(): string;
    getTianShen(): string;
    getTianShenType(): string;  // 黄道 | 黑道
  }

  class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getYear(): number;
    getMonth(): number;  // negative = leap month
    getDay(): number;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getZhiXing(): string;          // 建除十二值星
    getDayTianShen(): string;      // 黄道/黑道十二神
    getDayTianShenType(): string;  // 黄道 | 黑道
    getXiu(): string;              // 二十八宿
    getXiuLuck(): string;          // 吉 | 凶
    getJieQi(): string;            // 当天节气（无则空串）
    getTimes(): LunarTime[];
    getSolar(): Solar;
  }

  class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }
}
