import { useState, useEffect } from "react";
import { Upload, Link, Search, Shirt, Loader2, Image as ImageIcon, X, Info } from "lucide-react";

// --- NoResultFound Component ---
const NoResultFound = ({ initialLoad = false }) => {
  const initialMessage = "Upload an image or enter a URL above to start finding similar products.";
  const noMatchMessage = "We couldn't find any products matching your search criteria. Try a different image or adjust your filters.";

  const message = initialLoad ? initialMessage : noMatchMessage;
  const iconColor = initialLoad ? "text-sky-400" : "text-amber-500";
  const icon = initialLoad ? (
    <Info className="w-16 h-16 mx-auto mb-6" />
  ) : (
    <Search className="w-16 h-16 mx-auto mb-6" />
  );
  const title = initialLoad ? "Welcome to Vision Match" : "No Matches Found";

  return (
    <div className="text-gray-200 py-20 text-center col-span-full bg-gray-800 rounded-2xl border-4 border-dashed border-gray-600 shadow-inner flex flex-col items-center justify-center px-4">
      <div className={`${iconColor} transition duration-300 transform hover:scale-110`}>{icon}</div>
      <h3 className="text-3xl font-extrabold text-white mb-4">{title}</h3>
      <p className="text-xl font-medium text-gray-300 max-w-lg leading-relaxed">{message}</p>
    </div>
  );
};

function App() {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0);

  // --- Filtering Logic ---
  useEffect(() => {
    let tempResults = allProducts;
    const threshold = similarityThreshold || 0;

    if (threshold > 0) {
      tempResults = tempResults.filter((product) => product.similarity_score >= threshold);
    }

    if (searchKeyword.trim()) {
      const regex = new RegExp(searchKeyword.trim(), "i");
      tempResults = tempResults.filter((product) => regex.test(product.product_name));
    }

    setFilteredResults(tempResults);
  }, [searchKeyword, allProducts, similarityThreshold]);

  // --- Input Handlers ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
      setImageUrl("");
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setFile(null);
    setImagePreviewUrl(null);
    document.getElementById("fileInput").value = "";
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const clearFileAndPreview = () => {
    setFile(null);
    setImagePreviewUrl(null);
    document.getElementById("fileInput").value = "";
  };

  // --- Submit (File Upload) ---
  const handleFileSubmit = async () => {
    if (!file) return console.error("Please select a file first!");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (category) formData.append("category", category);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(`${backendUrl}/api/search-by-file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const newResults = data.results || [];

      setAllProducts(newResults);
      setFilteredResults(newResults);
      setIsLoaded(true);
      setCategory("");
      clearFileAndPreview();
    } catch (error) {
      console.error("Error searching by file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Submit (URL Input) ---
  const handleUrlSubmit = async () => {
    if (!imageUrl) return console.error("Please enter an image URL");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    if (category) formData.append("category", category);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(`${backendUrl}/api/search-by-url`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Search by URL response:", data);

      const newResults = data.results || [];
      setAllProducts(newResults);
      setFilteredResults(newResults);
      setIsLoaded(true);
      setCategory("");
      setImageUrl("");
      setFile(null);
      setImagePreviewUrl(null);
    } catch (err) {
      console.error("Error searching by URL:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-sky-700 shadow-xl border-b-4 border-amber-400 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ImageIcon className="text-amber-300 w-10 h-10 transform rotate-6" />
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Vision Match Engine</h1>
          </div>
          <p className="hidden md:block text-sky-200 text-lg font-medium">
            Powering next-gen visual product discovery
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-12 border-4 border-amber-100 transform transition duration-300 hover:shadow-cyan-400/50">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-8 pb-4 border-b-4 border-amber-500/80 flex items-center gap-3">
            <Upload className="text-cyan-600 w-7 h-7" /> Upload & Scan
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* File Upload */}
            <div className="lg:col-span-2">
              <label className="block text-lg font-semibold text-gray-700 mb-3">Upload Product Image</label>
              <div className="border-4 border-dashed border-cyan-400/70 bg-sky-50/50 rounded-2xl p-12 text-center transition duration-300 hover:border-cyan-600 hover:bg-sky-100/70 shadow-inner">
                <p className="text-sky-800 font-extrabold text-xl mb-6">Drop or select your image file</p>

                <div className="mb-6 flex justify-center h-40">
                  {imagePreviewUrl ? (
                    <div className="relative">
                      <img
                        src={imagePreviewUrl}
                        alt="Uploaded Preview"
                        className="h-40 w-auto object-contain rounded-lg border-4 border-amber-500 shadow-2xl"
                      />
                      <button
                        onClick={clearFileAndPreview}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition"
                        aria-label="Remove uploaded image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <ImageIcon className="w-16 h-16 text-cyan-500/80" />
                  )}
                </div>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-4 block mx-auto text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-base file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 transition duration-200 cursor-pointer shadow-md hover:shadow-lg"
                />
                <button
                  className="mt-8 w-full md:w-auto px-12 py-4 bg-amber-500 text-gray-900 font-extrabold rounded-full shadow-lg shadow-amber-400/60 hover:bg-amber-600 transition duration-200 transform hover:scale-[1.02] flex items-center justify-center mx-auto gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleFileSubmit}
                  disabled={isLoading || !file}
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                  {isLoading ? "Analyzing File..." : "Search by Uploaded File"}
                </button>
              </div>
            </div>

            {/* Divider + URL Input */}
            <div className="flex flex-row lg:flex-col items-center justify-center py-6 lg:py-0">
              <div className="flex-1 border-t-2 lg:border-t-0 lg:border-r-2 border-gray-300 w-full h-full"></div>
              <span className="px-6 text-gray-600 font-extrabold text-2xl lg:text-3xl text-amber-500">OR</span>
              <div className="flex-1 border-t-2 lg:border-t-0 lg:border-r-2 border-gray-300 w-full h-full"></div>
            </div>

            <div className="lg:col-span-1 flex flex-col justify-start">
              <label htmlFor="imageUrlInput" className="block text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Link className="text-cyan-600 w-5 h-5" /> Enter Direct Image URL
              </label>
              <input
                id="imageUrlInput"
                type="text"
                placeholder="https://example.com/product_photo.png"
                value={imageUrl}
                onChange={handleUrlChange}
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-200 focus:border-amber-500 shadow-inner text-base mb-6"
              />
              <button
                className="w-full px-8 py-3 bg-amber-500 text-gray-900 font-extrabold rounded-xl shadow-lg shadow-amber-400/30 hover:bg-amber-600 transition duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUrlSubmit}
                disabled={isLoading || !imageUrl}
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                {isLoading ? "Analyzing URL..." : "Search by URL"}
              </button>
            </div>
          </div>

          {/* Optional Category Filter */}
          {(file || imageUrl || imagePreviewUrl) && (
            <div className="border-t-2 border-gray-200 pt-8 mt-10">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Shirt className="text-amber-500 w-5 h-5" /> Refine Search Parameters (Optional)
              </h3>
              <div className="max-w-xs">
                <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Category
                </label>
                <select
                  id="categorySelect"
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 shadow-sm text-base bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="Men">Men's Apparel</option>
                  <option value="Women">Women's Apparel</option>
                  <option value="Kids">Kids' Apparel</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-10 border-4 border-gray-700">
          <h2 className="text-3xl font-extrabold text-white mb-8 pb-4 border-b-4 border-cyan-500/80 flex items-center gap-3">
            <Search className="text-amber-400 w-7 h-7" /> Matching Products
          </h2>

          {isLoaded && (
            <div className="mb-10 flex flex-col md:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Filter results by product name..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 w-full md:w-auto px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 shadow-inner text-base bg-gray-800 text-white placeholder-gray-400"
              />
              <select
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full md:w-auto px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 shadow-inner text-base bg-gray-800 text-white"
              >
                <option value={0}>Min. Match Score (All)</option>
                <option value={0.6}>0.6 or Higher (High Confidence)</option>
                <option value={0.5}>0.5 or Higher</option>
                <option value={0.4}>0.4 or Higher</option>
                <option value={0.3}>0.3 or Higher (Lower Confidence)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {isLoading && (
              <div className="col-span-full py-16 text-center text-cyan-400">
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-cyan-500" />
                <p className="text-2xl font-semibold text-gray-200">Processing complex visual feature data...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a moment.</p>
              </div>
            )}

            {!isLoaded && !isLoading && allProducts.length === 0 && <NoResultFound initialLoad={true} />}

            {isLoaded && !isLoading && filteredResults.length > 0 ? (
              filteredResults.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-gray-800 p-5 border border-gray-700 rounded-2xl shadow-xl hover:shadow-cyan-500/50 transition duration-300 transform hover:-translate-y-2 flex flex-col items-center group"
                >
                  <div className="w-full h-48 overflow-hidden rounded-lg mb-4 bg-gray-700 border border-gray-700">
                    <img
                      src={item.image_url}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/256x256/374151/D1D5DB?text=No+Image";
                      }}
                      alt={item.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-extrabold text-center text-xl text-white break-words w-full mt-2 group-hover:text-amber-400 transition-colors duration-200">
                    {item.product_name}
                  </h3>
                  <p className="text-sm font-medium text-gray-400 mt-1">
                    Category: <span className="font-semibold text-sky-300">{item.category}</span>
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Match Score:{" "}
                    <span className="font-mono text-xs font-extrabold text-lime-400">
                      {(item.similarity_score * 100).toFixed(2)}%
                    </span>
                  </p>
                </div>
              ))
            ) : (
              isLoaded && !isLoading && <NoResultFound initialLoad={false} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
