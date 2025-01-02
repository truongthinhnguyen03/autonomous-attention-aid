import { writable } from 'svelte/store';

export const timeLeft = writable(60);

export function startTimer() {
    timeLeft.set(60);
    const timer = setInterval(() => {
        timeLeft.update(value => {
            if (value > 0) {
                return value - 1;
            } else {
                clearInterval(timer);
                return 0;
            }
        });
    }, 1000);
    
    return () => clearInterval(timer);
} 