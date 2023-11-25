﻿using WorkoutTracker.DataAccess;
using WorkoutTracker.Pages;
using static WorkoutTracker.Models.Workout;

namespace WorkoutTracker.Models
{
    public class Workout : ActivityBase
    {        
        public string? ProgramId { get; set; }
        public bool Started { get; set; } = false;
        public bool Completed { get; set; } = false;
        public List<WorkoutRoutine> Routines { get; set; } = new List<WorkoutRoutine>();

        public Workout() { }
        public Workout(string programId)
        {
            ProgramId = programId;
        }
        public class WorkoutRoutine : Routine
        {
            public string? RoutineId { get; set; }
            public int SequenceNumber { get; set; }
            public bool Started { get; set; } = false;
            public DateTime StartedAt {  get; set; }
            public bool Completed { get; set; } = false;
            public DateTime CompletedAt { get; set; }            
            public new List<WorkoutExercise> RoutineExercises { get; set; } = new List<WorkoutExercise>();
            public WorkoutRoutine()
            {
                
            }
            public WorkoutRoutine(Routine routine)
            {
                RoutineId = routine._id;
                Name = routine.Name;
                
            }
        }
        public class WorkoutExercise: RoutineExercise
        {
            public string? RoutineExerciseId { get; set; }
            public int SequenceNumber { get; set; }
            public bool Started { get; set; } = false;
            public DateTime StartedAt { get; set; }
            public bool Completed { get; set; } = false;
            public DateTime CompletedAt { get; set; }
            public int EndingWeight { get; set; }
            public new List<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();
            public WorkoutExercise()
            {
                
            }
            public WorkoutExercise(RoutineExercise routineExercise)
            {
                ExerciseId = routineExercise.ExerciseId;
                RoutineExerciseId = routineExercise._id;
                StartingWeight = routineExercise.StartingWeight;
                WeightUnits = routineExercise.WeightUnits;
                Name = routineExercise.Name;
                Notes = routineExercise.Notes;
                Repetitions = routineExercise.Repetitions;
            }
        }
        public class WorkoutSet
        {
            public int SequenceNumber { get; set; }
            public bool Started { get; set; } = false;
            public DateTime? StartedAt { get; set; }
            public bool Completed { get; set; } = false;
            public DateTime? CompletedAt { get; set; }
            public int? ExpectedReps { get; set; }
            public int? ActualRepetitions { get; set; }
            public int? ActualWeight { get; set; }
            public string? Notes { get; set; }
            public WorkoutSet()
            {
                
            }
        }
        public class WorkoutActivity
        {
            public string WorkoutId { get; set; }
            public string? PreviousWorkoutId { get; set; }
            public string ProgramName {  get; set; }
            public string RoutineName { get; set; }
            public bool RoutineStarted { get; set; }
            public string ExerciseName { get; set; }
            public string ActivityNotes { get; set; }
            public string ExerciseNotes { get; set; }
            public int ExerciseRepetitions { get; set; }
            public int ExerciseStartingWeight { get; set; }
            public int ActualRepetitions { get; set; }
            public int ActualWeight {  get; set; }
            public string ExerciseWeightUnits { get; set; }
            public int ExerciseMinutesBetweenSets { get; set; }
            public int RoutineSequenceNumber { get; set; }
            public int ExerciseSequenceNumber { get; set; }
            public int SetSequenceNumber { get; set; }
            public WorkoutActivity(Workout? previousWorkout, Workout currentWorkout, WorkoutRoutine currentRoutine, WorkoutExercise currentExercise, WorkoutSet currentSet)
            {
                WorkoutId = currentWorkout._id;
                PreviousWorkoutId = previousWorkout == null ? null : previousWorkout._id;
                ProgramName = currentWorkout.Name;
                RoutineName = currentRoutine.Name;
                RoutineStarted = currentRoutine.Started;
                ExerciseName = currentExercise.Name;
                ExerciseNotes = currentExercise.Notes;
                ExerciseRepetitions = currentExercise.Repetitions;
                ActualRepetitions = ExerciseRepetitions;
                ExerciseStartingWeight = previousWorkout == null ? currentExercise.StartingWeight : previousWorkout.Routines[currentRoutine.SequenceNumber - 1].RoutineExercises[currentExercise.SequenceNumber - 1].EndingWeight;
                ActualWeight = ExerciseStartingWeight;
                ExerciseWeightUnits = currentExercise.WeightUnits;                
                ExerciseMinutesBetweenSets = currentExercise.MinutesBetweenSets;                
                RoutineSequenceNumber = currentRoutine.SequenceNumber;
                ExerciseSequenceNumber = currentExercise.SequenceNumber;
                SetSequenceNumber = currentSet.SequenceNumber;
            }
            public async Task<bool> StartRoutine(Dictionary<string, IndexedDb> collections)
            {
                var now = new DateTime();
                var updatePrefix = $"routines.{RoutineSequenceNumber - 1}";
                dynamic updateObject = new System.Dynamic.ExpandoObject();
                var updateDictionary = updateObject as IDictionary<string, object>;                
                updateDictionary.Add($"{updatePrefix}.started", true);
                updateDictionary.Add($"{updatePrefix}.startedAt", now);
                return await collections["workouts"].Update(new { _id = WorkoutId }, new Dictionary<string, object>() { { "$set", updateDictionary } });
            }
            public async Task<bool> Done(Dictionary<string, IndexedDb> collections)
            {
                var now = new DateTime();
                var updatePrefix = $"routines.{RoutineSequenceNumber - 1}.routineExercises.{ExerciseSequenceNumber - 1}.sets.{SetSequenceNumber - 1}";
                dynamic updateObject = new System.Dynamic.ExpandoObject();
                var updateDictionary = updateObject as IDictionary<string, object>;
                updateDictionary.Add($"{updatePrefix}.notes", ActivityNotes);
                updateDictionary.Add($"{updatePrefix}.actualWeight", ActualWeight);
                updateDictionary.Add($"{updatePrefix}.actualRepetitions", ActualRepetitions);
                updateDictionary.Add($"{updatePrefix}.completed", true);
                updateDictionary.Add($"{updatePrefix}.completedAt", now);

                
                var _workout = await collections["workouts"].FindOne<Workout>(new { _id = WorkoutId });
                // check if it's the last set for the exercise
                var isLastSet = _workout.Routines[RoutineSequenceNumber].RoutineExercises[ExerciseSequenceNumber].Sets.Count == SetSequenceNumber;
                if (isLastSet)
                {
                    // check if all Sets have the same ActualWeight
                    var setList = _workout.Routines[RoutineSequenceNumber].RoutineExercises[ExerciseSequenceNumber].Sets;
                    var endingWeight = setList.All(_set => _set.ActualWeight == ActualWeight) ? ActualWeight : ExerciseStartingWeight;
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.routineExercises.{ExerciseSequenceNumber - 1}.endingWeight", endingWeight);
                    // mark set as complete
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.routineExercises.{ExerciseSequenceNumber - 1}.completed", true);
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.routineExercises.{ExerciseSequenceNumber - 1}.completedAt", now);
                }
                // check if it's the last exercise and set for the routine
                var isLastExercise = _workout.Routines[RoutineSequenceNumber].RoutineExercises.Count == ExerciseSequenceNumber;
                if (isLastExercise && isLastSet)
                {
                    // mark routine as complete
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.completed", true);
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.completedAt", now);
                }
                // check if it's the last routine, exercise, and set for the workout
                var isLastRoutine = _workout.Routines.Count == RoutineSequenceNumber;
                if (isLastRoutine && isLastExercise && isLastSet)
                {
                    // mark workout as complete
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.completed", true);
                    updateDictionary.Add($"routines.{RoutineSequenceNumber - 1}.completedAt", now);
                }                
                return await collections["workouts"].Update(new { _id = WorkoutId }, new Dictionary<string, object>() { { "$set", updateDictionary } });
            }
        }
        public async Task<string> Init(Dictionary<string, IndexedDb> collections)
        {
            var _program = await collections["programs"].FindOne<Program>(new { _id = this.ProgramId });
            Name = _program.Name;
            var _routinesQuery = new {_id = new Dictionary<string, List<string>>() { { "$in", _program.RoutineIds } } };
            var _routines = await collections["routines"].Find<List<Routine>>(_routinesQuery);
            for (var i = 0; i < _routines.Count; i++)
            {
                // preserve the sequence from _program.RoutineIds
                var _routine = _routines.First<Routine>(routine => routine._id == _program.RoutineIds[i]);
                var _workoutRoutine = new WorkoutRoutine(_routine);
                _workoutRoutine.SequenceNumber = i + 1;
                for (var _i = 0; _i < _routine.RoutineExercises.Count; _i++)
                {
                    var _routineExercise = _routine.RoutineExercises[_i];                   
                    var _workoutExercise = new WorkoutExercise(_routineExercise);
                    _workoutExercise.SequenceNumber = _i + 1;
                    for (var __i = 0; __i < _routineExercise.Sets; __i++)
                    {
                        var _workoutSet = new WorkoutSet();
                        _workoutSet.SequenceNumber = __i + 1;
                        _workoutSet.ExpectedReps = _routineExercise.Repetitions;
                        _workoutExercise.Sets.Add(_workoutSet);
                    }
                    _workoutRoutine.RoutineExercises.Add(_workoutExercise);

                }
                Routines.Add(_workoutRoutine);
            }
            return await collections["workouts"].Insert(this);
        }
        // TODO: implement mongo sort options
        private async Task<Workout>? GetLastWorkout(Dictionary<string, IndexedDb> collections)
        {
            if (ProgramId == null) return null;
            var query = new Dictionary<string, List<object>>() { { "$and", new List<object>()
                    {
                        new {_id = new Dictionary<string, string>(){ { "$ne", this._id } }},
                        new {programId = this.ProgramId}
                    } } };
            return await collections["workouts"].FindOne<Workout>(query);
        }
        public async Task<WorkoutActivity>? GetNextWorkoutActivity(Dictionary<string, IndexedDb> collections)
        {
            if (collections == null) return null;            
            var currentRoutine = this.Routines.OrderBy(routine => routine.SequenceNumber).First(routine => !routine.Completed);
            if (currentRoutine == null) return null;
            var currentExercise = currentRoutine.RoutineExercises.OrderBy(exercise => exercise.SequenceNumber).First(exercise => !exercise.Completed);
            if (currentExercise == null) return null;
            var currentSet = currentExercise.Sets.OrderBy(set => set.SequenceNumber).First(set => !set.Completed);
            if (currentSet == null) return null;
            var previousWorkout = await this.GetLastWorkout(collections);
            return new WorkoutActivity(previousWorkout, this, currentRoutine, currentExercise, currentSet);
        }
    }
}