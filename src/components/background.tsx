export const Background = () => {
    return (
        <div className="fixed flex h-screen w-full items-center justify-center overflow-hidden bg-scanlines">
            <div className="absolute inset-0 bg-blueprint-grid" aria-hidden="true" />
        </div>
    );
};
