export type EnvManagerConfig = {
    persons: Person[];
    expenseCategories: ExpenseCategory[];
    paymentConfigs: PaymentConfig[];
};

export type Person = {
    username: string;  // 使用者名稱, EX: 王大明
    userId: string; // 使用者 ID, EX: U[0-9a-f]{32}, https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#what-is-user-id
    account: Account; // 使用者帳務設定
}

// 帳務類型
export type Account = {
    // 分配比例，全部人物的帳務比例加總需要 100
    allocationPercentage: number;

    // 個人當天伙食費設定
    dailyMealCost: number;

    // 個人當月其餘花費設定
    monthlyOtherExpenses: number;
};

// 記帳類型，用於設定應用的全局帳務項目
export type ExpenseCategory = {
    name: string; // 類別名稱，例如：早餐、午餐、晚餐、消夜等
    isMealCost: boolean; // 是否為伙食費，若否則為月其餘花費
};

export type PaymentConfig = {
    name: string;
    isPublicExpense: boolean; // 是否為公共支出
};