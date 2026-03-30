"use client";

import { useState, useRef } from 'react';
import { extractTextFromFile } from '@/utils/textExtractor';
import { generateWordDocument } from '@/utils/wordGenerator';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fastMode, setFastMode] = useState(false); // DEFAULT TO FALSE (OCR) FOR MAXIMUM ACCURACY ON CORRUPT PDFS
  const [dualLanguage, setDualLanguage] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState('');
  
  // Image Crop State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setText('');
      setProgress(0);
      setCrop(undefined);
      setCompletedCrop(null);
      
      if (selectedFile.type.startsWith('image/')) {
        setImageSrc(URL.createObjectURL(selectedFile));
      } else {
        setImageSrc(null);
      }
      setCrop(undefined);
      setCompletedCrop(null);
      
      if (selectedFile.type.startsWith('image/')) {
        setImageSrc(URL.createObjectURL(selectedFile));
      } else {
        setImageSrc(null);
      }
    }
  };

  const handleRefresh = () => {
    // If it's heavily processing, reload the window to kill stuck workers and free memory
    if (isProcessing) {
      window.location.reload();
    } else {
      setFile(null);
      setText('');
      setProgress(0);
      setError(null);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      // reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setError(null);
        setText('');
        setProgress(0);
      } else {
        setError('نوع الملف غير مدعوم. يرجى اختيار ملف PDF أو صورة.');
      }
    }
  };

  const getCroppedImage = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) return null;
    const image = imgRef.current;
    
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 1);
    });
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      let fileToExtract = file;
      
      // If it's an image and has a valid crop drawn
      if (imageSrc && completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const croppedBlob = await getCroppedImage();
        if (croppedBlob) {
          fileToExtract = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
        }
      }

      const extractedText = await extractTextFromFile(
        fileToExtract, 
        (p) => { setProgress(Math.round(p * 100)); }, 
        fastMode, 
        dualLanguage, 
        startPage ? parseInt(startPage) : 1, 
        endPage ? parseInt(endPage) : null
      );
      setText(extractedText);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء استخراج النص.');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if (!text.trim()) return;
    const baseName = file ? file.name.substring(0, file.name.lastIndexOf('.')) : 'مستند';
    generateWordDocument(text, `${baseName}-نص.docx`);
  };

  const handleDownloadTxt = () => {
    if (!text.trim()) return;
    const baseName = file ? file.name.substring(0, file.name.lastIndexOf('.')) : 'مستند';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}-نص.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      alert('تم نسخ النص بنجاح!');
    }).catch(() => {
      setError('فشل نسخ النص، يرجى المحاولة مرة أخرى.');
    });
  };

  return (
    <main className="container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
        pdf extract to Arabic text
      </div>
      <header className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="MuslimWings Logo" style={{ width: '100px', marginBottom: '1rem', borderRadius: '20%' }} />
        <h1>مستخرج النصوص العربية</h1>
        <p>استخرج النصوص من ملفات PDF والصور بدقة عالية واستخدمها في مستندات Word</p>
      </header>

      <section className="glass-panel">
        <label 
          className="upload-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            id="file-upload"
            type="file" 
            accept="application/pdf, image/png, image/jpeg, image/jpg" 
            onChange={handleFileChange} 
          />
          <span className="upload-icon">📄</span>
          <h3>اختر ملف PDF أو صورة</h3>
          <p>اسحب وأفلت الملف هنا أو انقر للاختيار</p>
          {file && (
            <div className="file-info">
              تم اختيار: {file.name}
            </div>
          )}
        </label>

        {isProcessing && (
          <div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="status-text">
              جاري معالجة الملف واستخراج النص... {progress}%
            </div>
          </div>
        )}

        {error && (
          <div className="error-text">
            {error}
          </div>
        )}

        <div className="toggle-container">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={fastMode} 
              onChange={(e) => setFastMode(e.target.checked)} 
            />
            <span className="toggle-text">
              <strong>وضع الاستخراج السريع</strong> 
              <br/>
              (استخدمه لملفات PDF النصية. قم بإلغاء التحديد للصور والكتب الممسوحة ضوئياً للتعرف على الحروف الذكي OCR)
            </span>
          </label>

          <label className="toggle-label" style={{ marginTop: '1rem' }}>
            <input 
              type="checkbox" 
              checked={dualLanguage} 
              onChange={(e) => setDualLanguage(e.target.checked)} 
            />
            <span className="toggle-text">
              <strong>لغة مزدوجة (عربي + إنجليزي)</strong> 
              <br/>
              (حدد هذا الخيار إذا كان المستند النصي/الصورة يحتوي على كلمات إنجليزية مدمجة)
            </span>
          </label>
        </div>

        {file && file.type === 'application/pdf' && (
          <div className="range-container">
            <h3 style={{color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold'}}>نطاق الصفحات (اختياري)</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem'}}>اتركه فارغاً لاستخراج الملف بالكامل. مفيد جداً للكتب الضخمة.</p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <div style={{display: 'flex', flexDirection: 'column', width: '120px'}}>
                <label style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem'}}>من صفحة</label>
                <input type="number" min="1" value={startPage} onChange={e => setStartPage(e.target.value)} className="page-input" />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', width: '120px'}}>
                <label style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem'}}>إلى صفحة</label>
                <input type="number" min="1" placeholder="النهاية" value={endPage} onChange={e => setEndPage(e.target.value)} className="page-input" />
              </div>
            </div>
          </div>
        )}

        <div className="actions">
          <button 
            className="btn" 
            onClick={handleExtract} 
            disabled={!file || isProcessing}
          >
            <span>⚡</span> استخراج النص
          </button>

          {(file || text) && (
            <button
              className="btn btn-secondary"
              onClick={handleRefresh}
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
              title={isProcessing ? 'إيقاف المعالجة والتحديث' : 'مسح الملف'}
            >
              <span>🔄</span> تحديث
            </button>
          )}
        </div>
      </section>

      <section className="glass-panel textarea-container">
        <div className="textarea-header">
          <h2>النص المستخرج</h2>
        </div>
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          placeholder="سيظهر النص المستخرج هنا، أو يمكنك لصق أي نص عربي..."
        />
        
        <div className="actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleCopy} 
            disabled={!text.trim()}
          >
            <span>📋</span> نسخ النص
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleDownloadTxt} 
            disabled={!text.trim()}
          >
            <span>📝</span> حفظ كملف TXT
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleDownload} 
            disabled={!text.trim()}
          >
            <span>💾</span> حفظ كملف Word
          </button>
        </div>
      </section>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="MuslimWings Logo" style={{ width: '50px', marginBottom: '0.5rem', borderRadius: '15px' }} />
        <p>Created by <strong>Yazid Rahmouni</strong> © 2026</p>
      </footer>
    </main>
  );
}
