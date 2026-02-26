import React, { useState } from 'react';
import { HeartIcon, CheckCircleIcon } from './ui/icons';

const DonationFlow = () => {
    const [amount, setAmount] = useState<number | string>(10);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: ''
    });

    const handleAmountClick = (newAmount: number) => {
        setAmount(newAmount);
        setCustomAmount('');
    };
    
    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(value);
        setAmount(value ? parseInt(value, 10) : 'custom');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'number') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1 / $2').slice(0, 7);
        } else if (name === 'cvc') {
            formattedValue = value.replace(/\D/g, '').slice(0, 3);
        }

        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="w-full max-w-md mx-auto text-center animate-fade-in flex flex-col items-center justify-center h-full">
                <CheckCircleIcon className="w-24 h-24 text-success mb-6"/>
                <h2 className="text-3xl font-bold text-text-primary">¡Gracias por tu apoyo!</h2>
                <p className="text-lg text-text-secondary mt-2">Tu donación ha sido procesada exitosamente.</p>
                <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 px-6 py-2 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition duration-300"
                >
                    Hacer otra donación
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto animate-fade-in">
                <div className="bg-surface/50 border border-border rounded-xl backdrop-blur-sm shadow-2xl shadow-primary/10">
                    <div className="p-8 text-center border-b border-border">
                        <HeartIcon className="w-12 h-12 text-primary mx-auto mb-4 drop-shadow-text-glow-primary" />
                        <h2 className="text-3xl font-bold text-text-primary">Apoya el Desarrollo</h2>
                        <p className="text-text-secondary mt-2">Tu contribución ayuda a mantener y mejorar Alphapp AI.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">Selecciona un monto (USD)</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[5, 10, 20].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleAmountClick(val)}
                                        className={`p-4 rounded-lg border-2 font-bold text-lg transition-all ${amount === val ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-border text-text-secondary hover:border-primary/50'}`}
                                    >
                                        ${val}
                                    </button>
                                ))}
                                 <input
                                    type="text"
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    placeholder="Otro"
                                    className={`p-4 rounded-lg border-2 font-bold text-lg transition-all text-center w-full col-span-1 ${amount === 'custom' || (![5,10,20].includes(amount as number)) ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-border text-text-secondary hover:border-primary/50'} focus:ring-2 focus:ring-primary focus:outline-none`}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="card-number" className="block text-sm font-semibold text-text-primary mb-2">Información de Pago</label>
                            <div className="space-y-3">
                                <input
                                    id="card-number"
                                    name="number"
                                    type="text"
                                    value={cardDetails.number}
                                    onChange={handleInputChange}
                                    placeholder="Número de Tarjeta"
                                    className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                                    required
                                />
                                <div className="flex gap-3">
                                    <input
                                        name="expiry"
                                        type="text"
                                        value={cardDetails.expiry}
                                        onChange={handleInputChange}
                                        placeholder="MM / AA"
                                        className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                                        required
                                    />
                                    <input
                                        name="cvc"
                                        type="text"
                                        value={cardDetails.cvc}
                                        onChange={handleInputChange}
                                        placeholder="CVC"
                                        className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-lg rounded-lg hover:from-primary-focus hover:to-accent-focus transition-all transform hover:scale-105 duration-300 shadow-lg shadow-primary/30 disabled:opacity-50"
                        >
                            Donar ${typeof amount === 'number' ? amount : (customAmount || 0)}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DonationFlow;