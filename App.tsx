import React, { useState, useCallback } from 'react';
import { generateColoringBook } from './services/geminiService';
import type { GeneratedPage } from './types';
import Spinner from './components/Spinner';
import Chatbot from './components/Chatbot';

declare global {
  interface Window {
    jspdf: any;
  }
}

const EmptyState: React.FC = () => (
  <div className="text-center p-8 bg-white/60 rounded-2xl shadow-inner border border-rose-100 animate-fade-in">
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h3 className="mt-4 text-xl font-bold text-gray-700">Ready to create?</h3>
    <p className="mt-1 text-sm text-gray-500">Just type a theme and name above to begin.</p>
    <div className="mt-6">
      <p className="font-bold text-gray-600 mb-2">Need some inspiration?</p>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
          Underwater Kingdom
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
          Dinosaur Tea Party
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
          Robots in the Garden
        </span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!theme || !childName) {
      setError('Please fill in both the theme and the child\'s name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPages([]);

    try {
      const imageUrls = await generateColoringBook(theme, childName);
      const generatedPages: GeneratedPage[] = imageUrls.map((url, index) => ({
        id: index,
        label: index === 0 ? 'Cover' : `Page ${index}`,
        imageUrl: url,
      }));
      setPages(generatedPages);
    } catch (err) {
      console.error(err);
      setError('Failed to generate coloring book. The model might be busy. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [theme, childName]);

  const handleDownloadPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsPdfGenerating(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];
        if (pageData.imageUrl) {
          if (i > 0) {
            doc.addPage();
          }
          const img = new Image();
          img.src = pageData.imageUrl;
          await new Promise(resolve => { img.onload = resolve; });

          const aspectRatio = img.width / img.height;
          let imgWidth = usableWidth;
          let imgHeight = imgWidth / aspectRatio;

          if (imgHeight > usableHeight) {
              imgHeight = usableHeight;
              imgWidth = imgHeight * aspectRatio;
          }

          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          doc.addImage(pageData.imageUrl, 'PNG', x, y, imgWidth, imgHeight);
        }
      }
      doc.save(`${childName.replace(/ /g, '_')}_${theme.replace(/ /g, '_')}_coloring_book.pdf`);
    } catch (err) {
        console.error("PDF generation error:", err);
        setError("Could not create the PDF file. Please try again.");
    } finally {
        setIsPdfGenerating(false);
    }
  }, [pages, childName, theme]);
  
  const CrayonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 text-gray-700 font-nunito p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-patrick-hand text-rose-600 mb-2 tracking-wide">AI Coloring Book Creator</h1>
          <p className="text-lg text-gray-500">Bring your imagination to life with a personalized coloring book!</p>
        </header>

        <main>
          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col space-y-4">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">Coloring Theme</label>
                  <input
                    id="theme"
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., Space Dinosaurs or Magical Forest"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                  <input
                    id="childName"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g., Lily"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-rose-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:bg-rose-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    {isLoading ? <Spinner className="w-6 h-6 mr-2" /> : <CrayonIcon />}
                    {isLoading ? 'Creating Magic...' : 'Generate Book'}
                  </button>
              </div>
            </div>
             {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </div>

          {isLoading && (
            <div className="text-center">
                <p className="text-lg text-gray-600 mb-4 animate-pulse">Our AI artist is drawing your pages...</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
                </div>
            </div>
          )}

          {!isLoading && pages.length === 0 && <EmptyState />}

          {pages.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-rose-100 animate-fade-in">
                <h2 className="text-3xl font-bold text-center mb-6 text-rose-500 font-patrick-hand tracking-wide">Your Coloring Book is Ready!</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                    {pages.map((page, index) => (
                        <div 
                            key={page.id} 
                            className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-md border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-xl hover:border-rose-300 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <img src={page.imageUrl!} alt={page.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{page.label}</div>
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isPdfGenerating}
                        className="bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-300 transition-all duration-300 inline-flex items-center shadow-md hover:shadow-lg"
                    >
                         {isPdfGenerating ? <Spinner className="w-5 h-5 mr-2" /> : 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                            </svg>
                         }
                        {isPdfGenerating ? 'Preparing PDF...' : 'Download PDF'}
                    </button>
                </div>
            </div>
          )}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default App;