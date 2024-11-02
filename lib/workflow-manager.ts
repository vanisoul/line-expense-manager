﻿type StepType = "SEND_MESSAGE" | "AWAIT_USER_CONFIRMATION" | "ASK_INITIATOR" | "ASK_MAIN_CATEGORY" | "ASK_DETAIL" | "ASK_EXPENSE_TYPE" | "ASK_AMOUNT" | "COMPLETED";

type ItemData = {
    initiator?: string; // 申請人
    paymentName?: string; // 支出類型
    isPublicExpense?: boolean  // 是否為公共支出
    detail?: string; // 詳細說明
    amount?: number; // 金額
};

class WorkflowManager {
    private workflows: { [userId: string]: StepType } = {}; // 儲存每個使用者的當前步驟
    private locks: { [userId: string]: boolean } = {};     // 儲存每個使用者的鎖定狀態
    private data: { [userId: string]: ItemData } = {}; // 儲存每個使用者的流程資料

    // 初始化工作流程的初始步驟
    private initialStep: StepType = "SEND_MESSAGE";

    // 取得目前的使用者步驟
    getCurrentStep(userId: string): StepType {
        if (!this.workflows[userId]) {
            this.workflows[userId] = this.initialStep;
        }
        return this.workflows[userId];
    }

    // 設置使用者的步驟
    setStep(userId: string, step: StepType): void {
        this.workflows[userId] = step;
    }

    // 移動到下一步
    nextStep(userId: string): void {
        const currentStep = this.getCurrentStep(userId);
        const nextSteps: { [key: string]: StepType } = {
            SEND_MESSAGE: "AWAIT_USER_CONFIRMATION",
            AWAIT_USER_CONFIRMATION: "ASK_INITIATOR",
            ASK_INITIATOR: "ASK_MAIN_CATEGORY",
            ASK_MAIN_CATEGORY: "ASK_DETAIL",
            ASK_DETAIL: "ASK_EXPENSE_TYPE",
            ASK_EXPENSE_TYPE: "ASK_AMOUNT",
            ASK_AMOUNT: "COMPLETED"
        };
        this.setStep(userId, nextSteps[currentStep] || this.initialStep);
    }

    // 判斷目前是否在指定的步驟中
    isAtStep(userId: string, step: StepType): boolean {
        return this.getCurrentStep(userId) === step;
    }

    // 重置工作流程
    resetWorkflow(userId: string): void {
        this.workflows[userId] = this.initialStep;
    }

    // 刪除工作流程（可選，用於清理）
    deleteWorkflow(userId: string): void {
        delete this.workflows[userId];
    }

    // 鎖定使用者流程，防止其他操作介入
    lock(userId: string): void {
        this.locks[userId] = true;
    }

    // 解鎖使用者流程，允許後續操作
    unlock(userId: string): void {
        this.locks[userId] = false;
    }

    // 檢查使用者是否處於鎖定狀態
    isLocked(userId: string): boolean {
        return this.locks[userId] === true;
    }

    // 記錄流程資料
    setUserData(userId: string, key: keyof ItemData, value: any): void {
        if (!this.data[userId]) {
            this.data[userId] = {};
        }
        this.data[userId][key] = value;
    }

    // 取得使用者的資料
    getUserData(userId: string): ItemData {
        return this.data[userId] || {};
    }
}

// 導出單例的 WorkflowManager
export const workflowManager = new WorkflowManager();