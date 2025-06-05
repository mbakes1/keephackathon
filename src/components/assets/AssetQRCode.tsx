import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase/supabase';

type AssetQRCodeProps = {
  assetId: string;
  assetName: string;
};

export default function AssetQRCode({ assetId, assetName }: AssetQRCodeProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const generateQrCode = async () => {
      setLoading(true);
      
      try {
        // The URL that will be encoded in the QR code
        // This should point to the public page for this asset
        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/asset/${assetId}`;
        
        setQrUrl(publicUrl);
        
        // Save the QR URL to the asset record
        await supabase
          .from('assets')
          .update({ qr_code: publicUrl })
          .eq('id', assetId);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (assetId) {
      generateQrCode();
    }
  }, [assetId]);

  const handleDownload = () => {
    const canvas = document.getElementById('asset-qr-code') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${assetName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const qrCodeElement = document.getElementById('asset-qr-code-container');
    if (!qrCodeElement) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code for ${assetName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .qr-container {
              padding: 20px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              background-color: white;
              text-align: center;
            }
            h2 {
              margin-top: 16px;
              margin-bottom: 8px;
              font-size: 18px;
              font-weight: 600;
              color: #1e293b;
            }
            p {
              margin-top: 0;
              font-size: 14px;
              color: #64748b;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrCodeElement.innerHTML}
            <h2>${assetName}</h2>
            <p>Scan to view asset details</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Asset QR Code</h3>
      
      <div className="flex flex-col items-center" id="asset-qr-code-container">
        {qrUrl && (
          <QRCodeSVG
            id="asset-qr-code"
            value={qrUrl}
            size={200}
            level="H"
            includeMargin
            imageSettings={{
              src: '/vite.svg',
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        )}
      </div>
      
      <p className="text-sm text-slate-500 text-center mt-4 mb-6">
        Scan this QR code to view asset details or report if found
      </p>
      
      <div className="flex space-x-4 justify-center">
        <Button variant="outline" onClick={handleDownload} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}