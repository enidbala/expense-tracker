"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ExpensesList from "@/components/ExpensesList";
import AllExpensesChart from "@/components/AllExpensesChart";
import MonthlyExpensesChart from "@/components/MonthlyExpensesChart";
import CurrentMonthExpensesChart from "@/components/CurrentMonthExpensesChart";
import CurrentWeekExpensesChart from "@/components/CurrentWeekExpensesChart";

type Expense = {
    id: string;
    comment: string;
    amount: number;
    category: {
        id: string;
        name: string;
    };
    date: string;
};

type DailyExpense = {
    date: string;
    amount: number;
};

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch detailed expenses
                const { data: expensesData, error: expensesError } =
                    await supabase
                        .from("expenses")
                        .select(
                            `
                        *,
                        category:expense_categories(id, name)
                    `
                        )
                        .order("date", { ascending: true });

                // Fetch daily aggregated expenses
                const { data: dailyData, error: dailyError } =
                    await supabase.rpc("get_daily_expenses");
                // You'll need to create this function in Supabase - see below

                if (expensesError) throw expensesError;
                if (dailyError) throw dailyError;

                setExpenses(expensesData);
                setDailyExpenses(dailyData);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to fetch data"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("expenses")
                .delete()
                .eq("id", id);

            if (error) {
                throw new Error(error.message);
            }

            setExpenses((prevExpenses) =>
                prevExpenses.filter((expense) => expense.id !== id)
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to delete expense"
            );
        }
    };

    const handleUpdate = async (updatedExpense: Expense) => {
        try {
            const { error } = await supabase
                .from("expenses")
                .update({
                    comment: updatedExpense.comment,
                    amount: updatedExpense.amount,
                    date: updatedExpense.date,
                })
                .eq("id", updatedExpense.id);

            if (error) {
                throw new Error(error.message);
            }

            // Update local state
            setExpenses((prevExpenses) =>
                prevExpenses.map((expense) =>
                    expense.id === updatedExpense.id ? updatedExpense : expense
                )
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update expense"
            );
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!expenses.length) return <div>No expenses found</div>; // Test

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <CurrentMonthExpensesChart expenses={expenses} />
                <CurrentWeekExpensesChart expenses={expenses} />
            </div>
            <div className="mt-6">
                <MonthlyExpensesChart expenses={dailyExpenses} />
            </div>
            <div className="mt-6">
                <AllExpensesChart expenses={dailyExpenses} />
            </div>
            <div className="mt-6">
                <ExpensesList
                    expenses={expenses}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                />
            </div>
        </div>
    );
};

export default ExpensesPage;