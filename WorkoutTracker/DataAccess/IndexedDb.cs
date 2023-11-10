using Microsoft.JSInterop;
using System.Text.Json;

namespace WorkoutTracker.DataAccess
{
    public class IndexedDb
    {
        private IJSRuntime JsRuntime;
        public bool Initialized { get; private set; }
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
            Initialized = await JsRuntime.InvokeAsync<bool>("DBAccess.init", DatabaseName, Name, Version, IndexedFields);
        }
        // Implement Mongo-like methods....
        public async Task<string> Insert(string document)
        {
            return await JsRuntime.InvokeAsync<string>("DBAccess.insert", DatabaseName, Name, document);
        }
        public async Task<bool> Update(string query, string update)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.update", DatabaseName, Name, query, update);
        }
        public async Task<bool> Remove(string query)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.remove", DatabaseName, Name, query);
        }
        public async Task<T> FindOne<T>(string query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.findOne", DatabaseName, Name, query);
        }
        public async Task<T> Find<T>(string query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.find", DatabaseName, Name, query);
        }
        
    }
}
