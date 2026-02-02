import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export const PayPalPayment = ({ amount, onSuccess, onError }) => {
    return (
        <div className="z-0 relative">
            <PayPalScriptProvider options={{ "client-id": "test", currency: "USD" }}>
                <PayPalButtons
                    style={{ layout: "vertical", shape: "rect", label: "pay" }}
                    createOrder={(data, actions) => {
                        return actions.order.create({
                            purchase_units: [
                                {
                                    amount: {
                                        value: (amount / 130).toFixed(2), // Convert HTG to USD approx
                                    },
                                },
                            ],
                        });
                    }}
                    onApprove={async (data, actions) => {
                        const details = await actions.order.capture();
                        import logger from '../../utils/logger';

                        // ... existing code ...

                        logger.payment('paypal_payment', details.id, 'completed', {
                            payer: details.payer.name.given_name
                        });

                        onSuccess(details);
                    }}
                    onError={(err) => {
                        console.error("PayPal Error:", err);
                        if (onError) onError(err);
                    }}
                />
            </PayPalScriptProvider>
        </div>
    );
};
