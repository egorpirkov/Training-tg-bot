"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProgram = void 0;
const generateProgram = (base, maxWeight, programType = 'linear') => {
    const generated = {};
    const ratios = {
        linear: [0.7, 0.75, 0.8],
        wave: [0.65, 0.75, 0.85],
        undulating: [0.6, 0.7, 0.8],
    };
    Object.entries(base).forEach(([day, list], idx) => {
        const r = ratios[programType][idx % ratios[programType].length];
        generated[day] = list.map(e => ({
            weight: Math.round((maxWeight * r) / 2.5) * 2.5,
            reps: e.reps > 12 ? 8 : Math.max(e.reps, 3),
        }));
    });
    return generated;
};
exports.generateProgram = generateProgram;
