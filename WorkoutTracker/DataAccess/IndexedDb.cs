using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Xml.Linq;

namespace WorkoutTracker.DataAccess
{
    public class IndexedDb
    {
        private IJSRuntime JsRuntime;
        public string Name { get; set; }
        public int? Version { get; set; }
        public List<string>? IndexedFields { get; set; }
        public IndexedDb(IJSRuntime jsruntime, string name)
        {
            JsRuntime = jsruntime;
            Name = name;            
            JsRuntime.InvokeVoidAsync("DBAccess.init", Name);
        }
        public IndexedDb(IJSRuntime jsruntime, string name, int? version, List<string>? indexedFields)
        {
            JsRuntime = jsruntime;
            Name = name;
            Version = version;
            IndexedFields = indexedFields;
            JsRuntime.InvokeVoidAsync("DBAccess.init", Name, Version, IndexedFields);
        }
        // Implement Mongo-like methods....
    }
}
