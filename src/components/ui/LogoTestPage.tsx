'use client'

import React from 'react'
import { Logo, useLogoVariant } from './Logo'

// Test component to demonstrate logo variants on different backgrounds
export const LogoTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Logo Variant Test Page</h1>
        
        {/* Dark Background Tests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Dark Backgrounds (Should use light variant)</h2>
          
          {/* Purple Header Background */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg">
            <Logo variant="light" size="md" />
          </div>
          
          {/* Dark Background */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <Logo variant="light" size="lg" />
          </div>
          
          {/* Blue Gradient Background */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-lg">
            <Logo variant="light" size="sm" />
          </div>
        </div>
        
        {/* Light Background Tests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Light Backgrounds (Should use dark variant)</h2>
          
          {/* White Background */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <Logo variant="dark" size="md" />
          </div>
          
          {/* Light Gray Background */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <Logo variant="dark" size="lg" />
          </div>
          
          {/* Light Blue Background */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <Logo variant="dark" size="sm" />
          </div>
          
          {/* Light Purple Background */}
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <Logo variant="dark" size="md" />
          </div>
        </div>
        
        {/* Component Variations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Component Variations</h2>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Icon Only</h3>
              <Logo variant="dark" showIcon={true} showText={false} />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Text Only</h3>
              <Logo variant="dark" showIcon={false} showText={true} />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Full Logo - Different Sizes</h3>
              <div className="space-y-2">
                <Logo variant="dark" size="sm" />
                <Logo variant="dark" size="md" />
                <Logo variant="dark" size="lg" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Route-based Variant Logic Test */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Automatic Variant Detection</h2>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-2 text-sm">
              <p><strong>Current route-based logic:</strong></p>
              <p>• Light background pages (onboarding, signup, settings, etc.) → Dark logo</p>
              <p>• Dark background pages (dashboard, homepage header) → Light logo</p>
              <p>• useLogoVariant() hook automatically detects the correct variant</p>
            </div>
          </div>
        </div>
        
        {/* Color Reference */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Color Reference</h2>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">Light Variant (for dark backgrounds)</h3>
                <p>• &quot;My&quot; and &quot;Law&quot;: <span className="text-white bg-gray-800 px-2 py-1 rounded">text-white</span></p>
                <p>• &quot;Durham&quot;: <span className="text-teal-400 bg-gray-800 px-2 py-1 rounded">text-teal-400</span></p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Dark Variant (for light backgrounds)</h3>
                <p>• &quot;My&quot; and &quot;Law&quot;: <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded">text-gray-900</span></p>
                <p>• &quot;Durham&quot;: <span className="text-teal-500 bg-gray-100 px-2 py-1 rounded">text-teal-500</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogoTestPage