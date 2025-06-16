import React, { useEffect, useRef } from 'react';

interface ConfigInterfaceProps {

}

const ConfigInterface: React.FC<ConfigInterfaceProps> = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
  }, []);


  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
    
    </div>
  );
};

export default ConfigInterface;