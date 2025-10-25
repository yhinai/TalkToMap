/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Added FC to the React import.
import React, { FC } from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Welcome to CityVibe: AI City Insights</h2>
        <div className="popup-scrollable-content">
          <p>
          This interactive demo uses Gemini to analyze business environments and consumer trends for any city. Ask for an analysis, and watch as key insights and data visualizations appear on the dashboard.
          </p>
          <p>To get started:</p>
          <ol>
            <li>
              <span className="icon">play_circle</span>
              <div>Press the <strong>&nbsp; Play &nbsp;</strong> button to start the conversation.</div>
            </li>
            <li>
              <span className="icon">record_voice_over</span>
              <div><strong>Speak naturally &nbsp;</strong>to analyze a market. Try saying,
              "Analyze the coffee shop market in Seattle."</div>
            </li>
            <li>
              <span className="icon">dashboard</span>
              <div>Watch as the dashboard <strong>&nbsp; dynamically updates &nbsp;</strong> with
              charts and key metrics.</div>
            </li>
            <li>
              <span className="icon">keyboard</span>
              <div>Alternatively, <strong>&nbsp; type your requests &nbsp;</strong> into the message
              box.</div>
            </li>
            <li>
              <span className="icon">tune</span>
              <div>Click the <strong>&nbsp; Settings &nbsp;</strong> icon to customize the AI's
              voice and behavior.</div>
            </li>
          </ol>
        </div>
        <button onClick={onClose}>Got It, Let's Analyze!</button>
      </div>
    </div>
  );
};

export default PopUp;