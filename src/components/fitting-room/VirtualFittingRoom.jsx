import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, Shirt } from 'lucide-react';
import SizeInputForm from './SizeInputForm';
import SizeRecommendation from './SizeRecommendation';
import { useFittingRoom } from './useFittingRoom';

const VirtualFittingRoom = ({ product, triggerButton }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const { userStats, setUserStats, saveProfile, calculateSize, recommendation } = useFittingRoom(product);
    const [view, setView] = useState('input'); // input | result

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const handleCalculate = () => {
        calculateSize();
        setView('result');
    };

    const handleRecalculate = () => {
        setView('input');
    };

    const handleSave = () => {
        saveProfile();
        handleClose();
        alert(t('settings_saved_success')); // Reusing existing key or basic alert
    };

    return (
        <>
            {/* Trigger Button (Render Helper) */}
            {triggerButton ? (
                React.cloneElement(triggerButton, { onClick: handleOpen })
            ) : (
                <button
                    onClick={handleOpen}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
                >
                    <Shirt className="w-4 h-4" /> {t('fr_btn_try_on')}
                </button>
            )}

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-secondary/10 p-1.5 rounded-lg text-secondary">
                                    <Shirt className="w-5 h-5" />
                                </span>
                                {t('fr_modal_title')}
                            </h2>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {view === 'input' && (
                                <SizeInputForm
                                    userStats={userStats}
                                    setUserStats={setUserStats}
                                    onCalculate={handleCalculate}
                                    productCategory={product?.category}
                                />
                            )}

                            {view === 'result' && recommendation && (
                                <SizeRecommendation
                                    recommendation={recommendation}
                                    onRecalculate={handleRecalculate}
                                    onSaveProfile={handleSave}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VirtualFittingRoom;
