
import React, { useState } from 'react';
import { ShoppingBag, Ticket, ChefHat, ArrowRight, Check } from 'lucide-react';

interface Props {
    onFinish: () => void;
}

const STEPS = [
    {
        icon: ShoppingBag,
        color: 'bg-orange-100 text-orange-600',
        title: "Browse & Order",
        desc: "Add items to your cart and pay via UPI or Cash."
    },
    {
        icon: Ticket,
        color: 'bg-blue-100 text-blue-600',
        title: "Get Your Token",
        desc: "You'll get a unique Token Number (e.g. R-42). Stay alert!"
    },
    {
        icon: ChefHat,
        color: 'bg-green-100 text-green-600',
        title: "Listen & Pick Up",
        desc: "When the vendor calls your Token, show your screen and eat!"
    }
];

export const OnboardingWalkthrough: React.FC<Props> = ({ onFinish }) => {
    const [step, setStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setIsExiting(true);
        setTimeout(onFinish, 300); // Wait for exit animation
    };

    const CurrentIcon = STEPS[step].icon;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center transform transition-all duration-300 ${isExiting ? 'scale-90 translate-y-4' : 'scale-100 translate-y-0'}`}>
                
                {/* Progress Dots */}
                <div className="flex gap-2 mb-8">
                    {STEPS.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'}`} 
                        />
                    ))}
                </div>

                {/* Animated Icon */}
                <div key={step} className={`${STEPS[step].color} w-32 h-32 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300 shadow-sm`}>
                    <CurrentIcon size={64} strokeWidth={1.5} />
                </div>

                {/* Text Content */}
                <div key={`text-${step}`} className="animate-in slide-in-from-bottom-4 fade-in duration-300 space-y-2 mb-8 min-h-[80px]">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {STEPS[step].title}
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {STEPS[step].desc}
                    </p>
                </div>

                {/* Buttons */}
                <div className="w-full space-y-3">
                    <button 
                        onClick={handleNext}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        {step === STEPS.length - 1 ? (
                            <>Let's Eat! <Check size={20} /></>
                        ) : (
                            <>Next <ArrowRight size={20} /></>
                        )}
                    </button>
                    
                    {step < STEPS.length - 1 && (
                        <button 
                            onClick={handleFinish}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 py-2"
                        >
                            Skip Intro
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
