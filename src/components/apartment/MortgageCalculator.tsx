"use client";

import React, { useState, useEffect } from "react";
import { Calculator, Percent, Calendar, TrendingUp } from "lucide-react";

interface MortgageCalculatorProps {
  price: number;
}

export default function MortgageCalculator({ price }: MortgageCalculatorProps) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(3.5);
  const [durationYears, setDurationYears] = useState(25);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  const calculateMortgage = () => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    
    if (loanAmount <= 0) {
      setMonthlyPayment(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    const monthlyRate = (interestRate / 100) / 12;
    const totalPayments = durationYears * 12;

    if (monthlyRate === 0) {
      const monthly = loanAmount / totalPayments;
      setMonthlyPayment(monthly);
      setTotalPayment(loanAmount);
      setTotalInterest(0);
      return;
    }

    const monthly = 
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const total = monthly * totalPayments;
    const interest = total - loanAmount;

    setMonthlyPayment(monthly);
    setTotalPayment(total);
    setTotalInterest(interest);
  };

  useEffect(() => {
    calculateMortgage();
  }, [price, downPaymentPct, interestRate, durationYears]);

  const downPaymentAmt = price * (downPaymentPct / 100);
  const loanAmt = price - downPaymentAmt;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Calculator className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Simulateur de Crédit</h3>
      </div>

      <div className="space-y-4">
        {/* Down payment control */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Apport Personnel ({downPaymentPct}%)
            </label>
            <span className="text-xs font-semibold text-slate-900">
              {downPaymentAmt.toLocaleString()} DT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="80"
              step="5"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Interest rate control */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Taux d'Intérêt
            </label>
            <span className="text-xs font-semibold text-slate-900">
              {interestRate}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Duration control */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Durée du Prêt (Années)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 20, 25, 30].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setDurationYears(y)}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  durationYears === y
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {y} ans
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output results */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <div className="text-center pb-3 border-b border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mensualité Estimée</span>
          <span className="text-3xl font-extrabold text-amber-500 mt-1 block">
              {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} DT/mois
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Capital Emprunté</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{loanAmt.toLocaleString()} DT</span>
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Intérêts Totaux</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })} DT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
