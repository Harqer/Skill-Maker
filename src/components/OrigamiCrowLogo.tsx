import React from "react";

interface OrigamiCrowLogoProps {
  className?: string;
  size?: number;
}

export const OrigamiCrowLogo: React.FC<OrigamiCrowLogoProps> = ({
  className = "",
  size = 56, // Increased default size to make it bigger as requested
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Soft elegant background glow for contrast */}
      <div className="absolute inset-0 bg-white/5 rounded-full blur-lg" />
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
      >
        {/* White outline style Origami Crow with clean vectors */}
        <g transform="translate(5, 18)">
          {/* Back tail feather / lower base */}
          <polygon
            points="10,48 24,42 42,46 16,52"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            points="16,52 42,46 48,50 20,56"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Under-wing / secondary body fold */}
          <polygon
            points="24,42 42,46 46,38"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Main Wing facets */}
          <polygon
            points="42,46 68,44 60,34 46,38"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            points="46,38 60,34 52,28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Upper Back / Neck join */}
          <polygon
            points="52,28 66,28 60,34"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Main Chest side fold */}
          <polygon
            points="60,34 68,44 76,38 72,28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Throat segment */}
          <polygon
            points="72,28 76,38 86,28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Head polygon */}
          <polygon
            points="72,28 86,28 82,20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Beak upper & lower */}
          <polygon
            points="86,28 102,24 82,20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            points="86,28 102,24 84,26"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Lower Belly */}
          <polygon
            points="68,44 76,38 74,48"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Leg joint and foot origami fold */}
          <polygon
            points="68,44 74,48 66,56 64,50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            points="66,56 67,68 64,50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            points="67,68 68,74 65,74"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Eye spot - in white outline for color theory purity */}
          <circle cx="81" cy="24" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};
