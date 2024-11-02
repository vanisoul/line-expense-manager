import type { EnvManagerConfig, Person, ExpenseCategory } from "../models/env-model";

/*
export WHITELIST_USER_IDS="U1234567890abcdef1234567890abcdef,Uabcdef1234567890abcdef1234567890,U88888888888888888888888888888888"

export PERSON_COUNT=2
export PERSON_1_USERNAME="王大明"
export PERSON_1_USERID="U1234567890abcdef1234567890abcdef"
export PERSON_1_ALLOCATION_PERCENTAGE=50
export PERSON_1_DAILY_MEAL_COST=200
export PERSON_1_MONTHLY_OTHER_EXPENSES=1000

export PERSON_2_USERNAME="李小美"
export PERSON_2_USERID="Uabcdef1234567890abcdef1234567890"
export PERSON_2_ALLOCATION_PERCENTAGE=50
export PERSON_2_DAILY_MEAL_COST=150
export PERSON_2_MONTHLY_OTHER_EXPENSES=800

export EXPENSE_CATEGORY_COUNT=3
export EXPENSE_CATEGORY_1_NAME="早餐"
export EXPENSE_CATEGORY_1_IS_MEAL_COST=true

export EXPENSE_CATEGORY_2_NAME="午餐"
export EXPENSE_CATEGORY_2_IS_MEAL_COST=true

export EXPENSE_CATEGORY_3_NAME="消夜"
export EXPENSE_CATEGORY_3_IS_MEAL_COST=false
*/

export class EnvManager {
    config: EnvManagerConfig;

    constructor() {
        this.config = this.loadConfigFromEnv();
    }

    private loadConfigFromEnv(): EnvManagerConfig {
        const persons = this.loadPersons();
        const expenseCategories = this.loadExpenseCategories();

        return {
            persons,
            expenseCategories,
        };
    }

    private loadPersons(): Person[] {
        const personCount = Number(process.env.PERSON_COUNT || 0);
        const persons: Person[] = [];

        for (let i = 1; i <= personCount; i++) {
            const username = process.env[`PERSON_${i}_USERNAME`] || '';
            const userId = process.env[`PERSON_${i}_USERID`] || '';
            const allocationPercentage = Number(process.env[`PERSON_${i}_ALLOCATION_PERCENTAGE`] || 0);
            const dailyMealCost = Number(process.env[`PERSON_${i}_DAILY_MEAL_COST`] || 0);
            const monthlyOtherExpenses = Number(process.env[`PERSON_${i}_MONTHLY_OTHER_EXPENSES`] || 0);

            persons.push({
                username,
                userId,
                account: {
                    allocationPercentage,
                    dailyMealCost,
                    monthlyOtherExpenses,
                },
            });
        }

        return persons;
    }

    private loadExpenseCategories(): ExpenseCategory[] {
        const categoryCount = Number(process.env.EXPENSE_CATEGORY_COUNT || 0);
        const categories: ExpenseCategory[] = [];

        for (let i = 1; i <= categoryCount; i++) {
            const name = process.env[`EXPENSE_CATEGORY_${i}_NAME`] || '';
            const isMealCost = process.env[`EXPENSE_CATEGORY_${i}_IS_MEAL_COST`] === 'true';

            categories.push({
                name,
                isMealCost,
            });
        }

        return categories;
    }

    private loadWhitelistUserIds(): Set<string> {
        const whitelist = process.env.WHITELIST_USER_IDS || '';
        return new Set(whitelist.split(',').map(id => id.trim()).filter(id => id !== ''));
    }

    getConfig(): EnvManagerConfig {
        return this.config;
    }
}

// CHANNEL_SECRET
export const channelSecret = process.env.CHANNEL_SECRET || "";
// CHANNEL_ACCESS_TOKEN
export const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN || "";