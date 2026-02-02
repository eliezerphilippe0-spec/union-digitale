import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ruler, Weight, User } from 'lucide-react';

const SizeInputForm = ({ userStats, setUserStats, onCalculate, productCategory = 'clothing' }) => {
    const { t } = useLanguage();
    const isShoe = productCategory === 'shoes';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserStats(prev => ({ ...prev, [name]: value }));
    };

    // Helper to generate options
    const RadioGroup = ({ name, options, label }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <label key={opt.value} className={`
                        cursor-pointer px-3 py-2 rounded-lg border text-sm flex-1 text-center transition-all
                        ${userStats[name] === opt.value
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                    `}>
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={userStats[name] === opt.value}
                            onChange={handleChange}
                            className="hidden"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ruler className="text-secondary" /> {t('fr_step_input')}
            </h3>

            <RadioGroup
                name="gender"
                label={t('fr_label_gender')}
                options={[
                    { value: 'male', label: t('fr_gender_male') },
                    { value: 'female', label: t('fr_gender_female') },
                    { value: 'unisex', label: t('fr_gender_unisex') }
                ]}
            />

            {isShoe ? (
                // --- SHOE INPUTS ---
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('fr_label_foot_length')}</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="footLength"
                                value={userStats.footLength || ''}
                                onChange={handleChange}
                                placeholder="ex: 26.5"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-secondary focus:outline-none pl-8"
                            />
                            <Ruler className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Mesurez du talon au gros orteil.</p>
                    </div>

                    <RadioGroup
                        name="footWidth"
                        label={t('fr_label_foot_width')}
                        options={[
                            { value: 'narrow', label: t('fr_foot_narrow') },
                            { value: 'normal', label: t('fr_foot_normal') },
                            { value: 'wide', label: t('fr_foot_wide') }
                        ]}
                    />
                </>
            ) : (
                // --- CLOTHING INPUTS ---
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fr_label_height')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="height"
                                    value={userStats.height}
                                    onChange={handleChange}
                                    placeholder="175"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-secondary focus:outline-none pl-8"
                                />
                                <Ruler className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fr_label_weight')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="weight"
                                    value={userStats.weight}
                                    onChange={handleChange}
                                    placeholder="70"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-secondary focus:outline-none pl-8"
                                />
                                <Weight className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <RadioGroup
                        name="bodyType"
                        label={t('fr_label_body_type')}
                        options={[
                            { value: 'slim', label: t('fr_body_slim') },
                            { value: 'average', label: t('fr_body_average') },
                            { value: 'broad', label: t('fr_body_broad') },
                            { value: 'curvy', label: t('fr_body_curvy') }
                        ]}
                    />

                    <RadioGroup
                        name="fitPreference"
                        label={t('fr_label_fit_pref')}
                        options={[
                            { value: 'tight', label: t('fr_fit_tight') },
                            { value: 'regular', label: t('fr_fit_regular') },
                            { value: 'loose', label: t('fr_fit_loose') }
                        ]}
                    />
                </>
            )}

            <button
                onClick={onCalculate}
                disabled={isShoe ? !userStats.footLength : (!userStats.height || !userStats.weight)}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 mt-4"
            >
                {t('fr_btn_find_size')}
            </button>
        </div>
    );
};

export default SizeInputForm;
