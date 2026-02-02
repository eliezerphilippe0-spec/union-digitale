import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const Celebration = ({ duration = 5000 }) => {
    const { width, height } = useWindowSize();
    const [recycling, setRecycling] = useState(true);
    const [run, setRun] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRecycling(false); // Stop generating new confetti
        }, duration);

        const stopTimer = setTimeout(() => {
            setRun(false); // Remove component from DOM eventually
        }, duration + 5000); // Allow time for existing confetti to fall

        return () => {
            clearTimeout(timer);
            clearTimeout(stopTimer);
        };
    }, [duration]);

    if (!run) return null;

    return (
        <Confetti
            width={width}
            height={height}
            recycle={recycling}
            numberOfPieces={400}
            gravity={0.15}
        />
    );
};

export default Celebration;
