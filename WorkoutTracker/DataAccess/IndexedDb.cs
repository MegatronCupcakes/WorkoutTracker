﻿using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Text.Json;
using WorkoutTracker.Models;

namespace WorkoutTracker.DataAccess
{
    public class IndexedDb
    {
        private IJSRuntime JsRuntime;

        private static JsonSerializerOptions serializeOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };


        public bool Initialized { get; private set; } = false;

        public event EventHandler<bool>? DbInitialized;
        public virtual void OnDbInitialized(bool IsInitialized)
        {
            DbInitialized?.Invoke(this, IsInitialized);
        }
        
        private string DatabaseName = CollectionDefinitions.DatabaseName;
        public string Name { get; set; }
        
        public List<string>? IndexedFields { get; set; }
        public IndexedDb(IJSRuntime jsruntime, string name)
        {
            JsRuntime = jsruntime;
            Name = name;
            Init();
        }
        public IndexedDb(IJSRuntime jsruntime, string name, List<string>? indexedFields)
        {
            JsRuntime = jsruntime;
            Name = name;            
            IndexedFields = indexedFields;
            Init();
        }
        private async void Init()
        {
            Initialized = await JsRuntime.InvokeAsync<bool>("DBAccess.init", DatabaseName, Name, IndexedFields);
            OnDbInitialized(Initialized);
        }
        /// <summary>
        /// Export json data for list of objectStores
        /// </summary>
        /// <param name="objectStoreNames"></param>
        public static async Task<bool> Export(List<string> objectStoreNames, IJSRuntime JsRuntime)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.export", CollectionDefinitions.DatabaseName, objectStoreNames);
        }
        /// <summary>
        /// Import data from json file
        /// </summary>
        /// <param name="dataImport"></param>
        /// <returns></returns>
        public static async Task<bool> Import(JsonImport dataImport, IJSRuntime JsRuntime)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.import", CollectionDefinitions.DatabaseName, JsonSerializer.Serialize(dataImport, serializeOptions));
        }

        public async Task<int> Count()
        {
            return await JsRuntime.InvokeAsync<int>("DBAccess.count", DatabaseName, Name);
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
        public async Task<string> Insert(object document)
        {
            return await JsRuntime.InvokeAsync<string>("DBAccess.insert", DatabaseName, Name, JsonSerializer.Serialize(document, serializeOptions));
        }

        /// <summary>
        /// Update existing document(s) matching search criteria.
        /// </summary>
        /// <param name="query"></param>
        /// <param name="update"></param>
        /// <returns>updated boolean</returns>
        public async Task<bool> Update(string query, string update)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.update", DatabaseName, Name, query, update);
        }
        public async Task<bool> Update(string query, object update)
        {            
            return await JsRuntime.InvokeAsync<bool>(
                "DBAccess.update", 
                DatabaseName, 
                Name, 
                query, 
                JsonSerializer.Serialize(update, serializeOptions)
                );
        }
        public async Task<bool> Update(object query, object update)
        {
            return await JsRuntime.InvokeAsync<bool>(
                "DBAccess.update", 
                DatabaseName, 
                Name, 
                JsonSerializer.Serialize(query, serializeOptions), 
                JsonSerializer.Serialize(update, serializeOptions)
                );
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
        public async Task<bool> Remove(object query)
        {
            return await JsRuntime.InvokeAsync<bool>("DBAccess.remove", DatabaseName, Name, JsonSerializer.Serialize(query, serializeOptions));
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
        public async Task<T> FindOne<T>(object query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.findOne", DatabaseName, Name, JsonSerializer.Serialize(query, serializeOptions));
        }
        public async Task<T> FindOne<T>(object query, object options)
        {
            return await JsRuntime.InvokeAsync<T>(
                "DBAccess.findOne", 
                DatabaseName, 
                Name, 
                JsonSerializer.Serialize(query, serializeOptions),
                JsonSerializer.Serialize(options, serializeOptions)
                );
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
        public async Task<T> Find<T>(object query)
        {
            return await JsRuntime.InvokeAsync<T>("DBAccess.find", DatabaseName, Name, JsonSerializer.Serialize(query, serializeOptions));
        }
        public async Task<T> Find<T>(object query, object options)
        {
            return await JsRuntime.InvokeAsync<T>(
                "DBAccess.find", 
                DatabaseName, 
                Name, 
                JsonSerializer.Serialize(query, serializeOptions),
                JsonSerializer.Serialize(options, serializeOptions)
                );
        }
        public async Task<T> Find<T>(string query, object options)
        {
            return await JsRuntime.InvokeAsync<T>(
                "DBAccess.find",
                DatabaseName,
                Name,
                query,
                JsonSerializer.Serialize(options, serializeOptions)
                );
        }
    }
}
