import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSwipeNavigation = () => {
    const navigate = useNavigate();

    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Thresholds
            const minSwipeDistance = 50;
            const maxVerticalDistance = 50; // Ensure it's mostly horizontal

            // Check if it's a horizontal swipe
            if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffY) < maxVerticalDistance) {
                // Swipe Right (Back) - Only if started from left edge (standard iOS behavior)
                if (diffX > 0 && touchStartX < 50) {
                    navigate(-1);
                }
                // Swipe Left (Forward) - Only if started from right edge
                else if (diffX < 0 && touchStartX > window.innerWidth - 50) {
                    navigate(1);
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigate]);
};
