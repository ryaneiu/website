interface FilterToggleProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

export function FilterToggle({ label, checked, onChange }: FilterToggleProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
            <span>{label}</span>
            <span className="relative inline-flex h-6 w-11">
                <input
                    aria-label={label}
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-black/20 dark:bg-white/20 transition-colors duration-300 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></span>
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 peer-checked:translate-x-5"></span>
            </span>
        </label>
    );
}