using Microsoft.JSInterop;
using System.Text.Json;

namespace WorkoutTracker.DataAccess
{
    public class IndexedDb
    {
        private IJSRuntime JsRuntime;
        
        
        public bool Initialized { get; private set; }

        public event EventHandler<bool> DbInitialized;
        public virtual void OnDbInitialized(bool IsInitialized)
        {
            DbInitialized?.Invoke(this, IsInitialized);
        }
        

        // Ideally DatabaseName is defined in configuration
        private string DatabaseName = "WorkoutTracker";
        public string Name { get; set; }
        public int? Version { get; set; }
        public List<string>? IndexedFields { get; set; }
        public IndexedDb(IJSRuntime jsruntime, string name)
        {
            Initialized = false;
            JsRuntime = jsruntime;
            Name = name;
            Init();
        }
        public IndexedDb(IJSRuntime jsruntime, string name, int? version, List<string>? indexedFields)
        {
            Initialized = false;
            JsRuntime = jsruntime;
            Name = name;
            Version = version;
            IndexedFields = indexedFields;
            Init();
        }
        private async void Init()
        {
            bool _isInitialized = await JsRuntime.InvokeAsync<bool>("DBAccess.init", DatabaseName, Name, Version, IndexedFields);
            OnDbInitialized(_isInitialized);
        }

        // Implement Mongo-like methods....

        /// <summary>
        /// Insert new document.
        /// </summary>
        /// <param name="document"></param>
        /// <returns>_id</returns>
        public async Task<string> Insert(string document)
        {
            return await JsRuntime.InvokeAsync<string>("DBAccess.insert", DatabaseName, Name, document);
        }

        /// <summary>
        /// Update existing document(s) matching search criteria.
        /// </summary>
        /// <param name="query"></param>
        /// <param name="update"></param>
        /// <returns>updated boolean</returns>
        public async Task<bool> Update<T>(string query, string update)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.update", DatabaseName, Name, query, update);
        }

        /// <summary>
        /// Remove existing document by _id.
        /// </summary>
        /// <param name="query"></param>
        /// <returns>deleted boolean</returns>
        public async Task<bool> Remove(string query)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.remove", DatabaseName, Name, query);
        }

        /// <summary>
        /// Find first document matching search criteria.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="query"></param>
        /// <returns>document</returns>
        public async Task<T> FindOne<T>(string query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.findOne", DatabaseName, Name, query);
        }

        /// <summary>
        /// Find all documents matching search criteria.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="query"></param>
        /// <returns>array of documents</returns>
        public async Task<T> Find<T>(string query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.find", DatabaseName, Name, query);
        }
        
    }
}
