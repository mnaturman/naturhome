import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CalendarEvent, Conversation, CreateConversationBody, CreateEventBody, CreateFamilyMemberBody, CreateMealBody, CreateTaskBody, DashboardSummary, FamilyMember, HealthStatus, ListEventsParams, ListMealsParams, ListTasksParams, Meal, Message, SendOpenaiMessageBody, Task, UpdateTaskBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all family members
 */
export declare const getListFamilyMembersUrl: () => string;
export declare const listFamilyMembers: (options?: RequestInit) => Promise<FamilyMember[]>;
export declare const getListFamilyMembersQueryKey: () => readonly ["/api/family-members"];
export declare const getListFamilyMembersQueryOptions: <TData = Awaited<ReturnType<typeof listFamilyMembers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFamilyMembers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listFamilyMembers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListFamilyMembersQueryResult = NonNullable<Awaited<ReturnType<typeof listFamilyMembers>>>;
export type ListFamilyMembersQueryError = ErrorType<unknown>;
/**
 * @summary List all family members
 */
export declare function useListFamilyMembers<TData = Awaited<ReturnType<typeof listFamilyMembers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFamilyMembers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a family member
 */
export declare const getCreateFamilyMemberUrl: () => string;
export declare const createFamilyMember: (createFamilyMemberBody: CreateFamilyMemberBody, options?: RequestInit) => Promise<FamilyMember>;
export declare const getCreateFamilyMemberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createFamilyMember>>, TError, {
        data: BodyType<CreateFamilyMemberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createFamilyMember>>, TError, {
    data: BodyType<CreateFamilyMemberBody>;
}, TContext>;
export type CreateFamilyMemberMutationResult = NonNullable<Awaited<ReturnType<typeof createFamilyMember>>>;
export type CreateFamilyMemberMutationBody = BodyType<CreateFamilyMemberBody>;
export type CreateFamilyMemberMutationError = ErrorType<unknown>;
/**
 * @summary Create a family member
 */
export declare const useCreateFamilyMember: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createFamilyMember>>, TError, {
        data: BodyType<CreateFamilyMemberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createFamilyMember>>, TError, {
    data: BodyType<CreateFamilyMemberBody>;
}, TContext>;
export declare const getGetFamilyMemberUrl: (id: number) => string;
export declare const getFamilyMember: (id: number, options?: RequestInit) => Promise<FamilyMember>;
export declare const getGetFamilyMemberQueryKey: (id: number) => readonly [`/api/family-members/${number}`];
export declare const getGetFamilyMemberQueryOptions: <TData = Awaited<ReturnType<typeof getFamilyMember>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFamilyMember>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFamilyMember>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFamilyMemberQueryResult = NonNullable<Awaited<ReturnType<typeof getFamilyMember>>>;
export type GetFamilyMemberQueryError = ErrorType<unknown>;
export declare function useGetFamilyMember<TData = Awaited<ReturnType<typeof getFamilyMember>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFamilyMember>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateFamilyMemberUrl: (id: number) => string;
export declare const updateFamilyMember: (id: number, createFamilyMemberBody: CreateFamilyMemberBody, options?: RequestInit) => Promise<FamilyMember>;
export declare const getUpdateFamilyMemberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFamilyMember>>, TError, {
        id: number;
        data: BodyType<CreateFamilyMemberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateFamilyMember>>, TError, {
    id: number;
    data: BodyType<CreateFamilyMemberBody>;
}, TContext>;
export type UpdateFamilyMemberMutationResult = NonNullable<Awaited<ReturnType<typeof updateFamilyMember>>>;
export type UpdateFamilyMemberMutationBody = BodyType<CreateFamilyMemberBody>;
export type UpdateFamilyMemberMutationError = ErrorType<unknown>;
export declare const useUpdateFamilyMember: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFamilyMember>>, TError, {
        id: number;
        data: BodyType<CreateFamilyMemberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateFamilyMember>>, TError, {
    id: number;
    data: BodyType<CreateFamilyMemberBody>;
}, TContext>;
export declare const getDeleteFamilyMemberUrl: (id: number) => string;
export declare const deleteFamilyMember: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteFamilyMemberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteFamilyMember>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteFamilyMember>>, TError, {
    id: number;
}, TContext>;
export type DeleteFamilyMemberMutationResult = NonNullable<Awaited<ReturnType<typeof deleteFamilyMember>>>;
export type DeleteFamilyMemberMutationError = ErrorType<unknown>;
export declare const useDeleteFamilyMember: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteFamilyMember>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteFamilyMember>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List calendar events
 */
export declare const getListEventsUrl: (params?: ListEventsParams) => string;
export declare const listEvents: (params?: ListEventsParams, options?: RequestInit) => Promise<CalendarEvent[]>;
export declare const getListEventsQueryKey: (params?: ListEventsParams) => readonly ["/api/events", ...ListEventsParams[]];
export declare const getListEventsQueryOptions: <TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEventsQueryResult = NonNullable<Awaited<ReturnType<typeof listEvents>>>;
export type ListEventsQueryError = ErrorType<unknown>;
/**
 * @summary List calendar events
 */
export declare function useListEvents<TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a calendar event
 */
export declare const getCreateEventUrl: () => string;
export declare const createEvent: (createEventBody: CreateEventBody, options?: RequestInit) => Promise<CalendarEvent>;
export declare const getCreateEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEvent>>, TError, {
        data: BodyType<CreateEventBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEvent>>, TError, {
    data: BodyType<CreateEventBody>;
}, TContext>;
export type CreateEventMutationResult = NonNullable<Awaited<ReturnType<typeof createEvent>>>;
export type CreateEventMutationBody = BodyType<CreateEventBody>;
export type CreateEventMutationError = ErrorType<unknown>;
/**
 * @summary Create a calendar event
 */
export declare const useCreateEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEvent>>, TError, {
        data: BodyType<CreateEventBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEvent>>, TError, {
    data: BodyType<CreateEventBody>;
}, TContext>;
export declare const getGetEventUrl: (id: number) => string;
export declare const getEvent: (id: number, options?: RequestInit) => Promise<CalendarEvent>;
export declare const getGetEventQueryKey: (id: number) => readonly [`/api/events/${number}`];
export declare const getGetEventQueryOptions: <TData = Awaited<ReturnType<typeof getEvent>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEventQueryResult = NonNullable<Awaited<ReturnType<typeof getEvent>>>;
export type GetEventQueryError = ErrorType<unknown>;
export declare function useGetEvent<TData = Awaited<ReturnType<typeof getEvent>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateEventUrl: (id: number) => string;
export declare const updateEvent: (id: number, createEventBody: CreateEventBody, options?: RequestInit) => Promise<CalendarEvent>;
export declare const getUpdateEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEvent>>, TError, {
        id: number;
        data: BodyType<CreateEventBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEvent>>, TError, {
    id: number;
    data: BodyType<CreateEventBody>;
}, TContext>;
export type UpdateEventMutationResult = NonNullable<Awaited<ReturnType<typeof updateEvent>>>;
export type UpdateEventMutationBody = BodyType<CreateEventBody>;
export type UpdateEventMutationError = ErrorType<unknown>;
export declare const useUpdateEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEvent>>, TError, {
        id: number;
        data: BodyType<CreateEventBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEvent>>, TError, {
    id: number;
    data: BodyType<CreateEventBody>;
}, TContext>;
export declare const getDeleteEventUrl: (id: number) => string;
export declare const deleteEvent: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEvent>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEvent>>, TError, {
    id: number;
}, TContext>;
export type DeleteEventMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEvent>>>;
export type DeleteEventMutationError = ErrorType<unknown>;
export declare const useDeleteEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEvent>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEvent>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List tasks
 */
export declare const getListTasksUrl: (params?: ListTasksParams) => string;
export declare const listTasks: (params?: ListTasksParams, options?: RequestInit) => Promise<Task[]>;
export declare const getListTasksQueryKey: (params?: ListTasksParams) => readonly ["/api/tasks", ...ListTasksParams[]];
export declare const getListTasksQueryOptions: <TData = Awaited<ReturnType<typeof listTasks>>, TError = ErrorType<unknown>>(params?: ListTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listTasks>>>;
export type ListTasksQueryError = ErrorType<unknown>;
/**
 * @summary List tasks
 */
export declare function useListTasks<TData = Awaited<ReturnType<typeof listTasks>>, TError = ErrorType<unknown>>(params?: ListTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a task
 */
export declare const getCreateTaskUrl: () => string;
export declare const createTask: (createTaskBody: CreateTaskBody, options?: RequestInit) => Promise<Task>;
export declare const getCreateTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
        data: BodyType<CreateTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
    data: BodyType<CreateTaskBody>;
}, TContext>;
export type CreateTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createTask>>>;
export type CreateTaskMutationBody = BodyType<CreateTaskBody>;
export type CreateTaskMutationError = ErrorType<unknown>;
/**
 * @summary Create a task
 */
export declare const useCreateTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
        data: BodyType<CreateTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTask>>, TError, {
    data: BodyType<CreateTaskBody>;
}, TContext>;
export declare const getUpdateTaskUrl: (id: number) => string;
export declare const updateTask: (id: number, updateTaskBody: UpdateTaskBody, options?: RequestInit) => Promise<Task>;
export declare const getUpdateTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
        id: number;
        data: BodyType<UpdateTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
    id: number;
    data: BodyType<UpdateTaskBody>;
}, TContext>;
export type UpdateTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updateTask>>>;
export type UpdateTaskMutationBody = BodyType<UpdateTaskBody>;
export type UpdateTaskMutationError = ErrorType<unknown>;
export declare const useUpdateTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
        id: number;
        data: BodyType<UpdateTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTask>>, TError, {
    id: number;
    data: BodyType<UpdateTaskBody>;
}, TContext>;
export declare const getDeleteTaskUrl: (id: number) => string;
export declare const deleteTask: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTask>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteTask>>, TError, {
    id: number;
}, TContext>;
export type DeleteTaskMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTask>>>;
export type DeleteTaskMutationError = ErrorType<unknown>;
export declare const useDeleteTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTask>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteTask>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List meal plans
 */
export declare const getListMealsUrl: (params?: ListMealsParams) => string;
export declare const listMeals: (params?: ListMealsParams, options?: RequestInit) => Promise<Meal[]>;
export declare const getListMealsQueryKey: (params?: ListMealsParams) => readonly ["/api/meals", ...ListMealsParams[]];
export declare const getListMealsQueryOptions: <TData = Awaited<ReturnType<typeof listMeals>>, TError = ErrorType<unknown>>(params?: ListMealsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMeals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMeals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMealsQueryResult = NonNullable<Awaited<ReturnType<typeof listMeals>>>;
export type ListMealsQueryError = ErrorType<unknown>;
/**
 * @summary List meal plans
 */
export declare function useListMeals<TData = Awaited<ReturnType<typeof listMeals>>, TError = ErrorType<unknown>>(params?: ListMealsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMeals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a meal plan entry
 */
export declare const getCreateMealUrl: () => string;
export declare const createMeal: (createMealBody: CreateMealBody, options?: RequestInit) => Promise<Meal>;
export declare const getCreateMealMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMeal>>, TError, {
        data: BodyType<CreateMealBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createMeal>>, TError, {
    data: BodyType<CreateMealBody>;
}, TContext>;
export type CreateMealMutationResult = NonNullable<Awaited<ReturnType<typeof createMeal>>>;
export type CreateMealMutationBody = BodyType<CreateMealBody>;
export type CreateMealMutationError = ErrorType<unknown>;
/**
 * @summary Create a meal plan entry
 */
export declare const useCreateMeal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMeal>>, TError, {
        data: BodyType<CreateMealBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createMeal>>, TError, {
    data: BodyType<CreateMealBody>;
}, TContext>;
export declare const getUpdateMealUrl: (id: number) => string;
export declare const updateMeal: (id: number, createMealBody: CreateMealBody, options?: RequestInit) => Promise<Meal>;
export declare const getUpdateMealMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMeal>>, TError, {
        id: number;
        data: BodyType<CreateMealBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMeal>>, TError, {
    id: number;
    data: BodyType<CreateMealBody>;
}, TContext>;
export type UpdateMealMutationResult = NonNullable<Awaited<ReturnType<typeof updateMeal>>>;
export type UpdateMealMutationBody = BodyType<CreateMealBody>;
export type UpdateMealMutationError = ErrorType<unknown>;
export declare const useUpdateMeal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMeal>>, TError, {
        id: number;
        data: BodyType<CreateMealBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMeal>>, TError, {
    id: number;
    data: BodyType<CreateMealBody>;
}, TContext>;
export declare const getDeleteMealUrl: (id: number) => string;
export declare const deleteMeal: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteMealMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMeal>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMeal>>, TError, {
    id: number;
}, TContext>;
export type DeleteMealMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMeal>>>;
export type DeleteMealMutationError = ErrorType<unknown>;
export declare const useDeleteMeal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMeal>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMeal>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get dashboard summary counts and upcoming items
 */
export declare const getGetDashboardSummaryUrl: () => string;
export declare const getDashboardSummary: (options?: RequestInit) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary counts and upcoming items
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get next 7 days of events
 */
export declare const getGetUpcomingEventsUrl: () => string;
export declare const getUpcomingEvents: (options?: RequestInit) => Promise<CalendarEvent[]>;
export declare const getGetUpcomingEventsQueryKey: () => readonly ["/api/dashboard/upcoming-events"];
export declare const getGetUpcomingEventsQueryOptions: <TData = Awaited<ReturnType<typeof getUpcomingEvents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUpcomingEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUpcomingEvents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUpcomingEventsQueryResult = NonNullable<Awaited<ReturnType<typeof getUpcomingEvents>>>;
export type GetUpcomingEventsQueryError = ErrorType<unknown>;
/**
 * @summary Get next 7 days of events
 */
export declare function useGetUpcomingEvents<TData = Awaited<ReturnType<typeof getUpcomingEvents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUpcomingEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get all incomplete tasks
 */
export declare const getGetPendingTasksUrl: () => string;
export declare const getPendingTasks: (options?: RequestInit) => Promise<Task[]>;
export declare const getGetPendingTasksQueryKey: () => readonly ["/api/dashboard/pending-tasks"];
export declare const getGetPendingTasksQueryOptions: <TData = Awaited<ReturnType<typeof getPendingTasks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPendingTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPendingTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPendingTasksQueryResult = NonNullable<Awaited<ReturnType<typeof getPendingTasks>>>;
export type GetPendingTasksQueryError = ErrorType<unknown>;
/**
 * @summary Get all incomplete tasks
 */
export declare function useGetPendingTasks<TData = Awaited<ReturnType<typeof getPendingTasks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPendingTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get this week's meal plan
 */
export declare const getGetThisWeekMealsUrl: () => string;
export declare const getThisWeekMeals: (options?: RequestInit) => Promise<Meal[]>;
export declare const getGetThisWeekMealsQueryKey: () => readonly ["/api/dashboard/this-week-meals"];
export declare const getGetThisWeekMealsQueryOptions: <TData = Awaited<ReturnType<typeof getThisWeekMeals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getThisWeekMeals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getThisWeekMeals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetThisWeekMealsQueryResult = NonNullable<Awaited<ReturnType<typeof getThisWeekMeals>>>;
export type GetThisWeekMealsQueryError = ErrorType<unknown>;
/**
 * @summary Get this week's meal plan
 */
export declare function useGetThisWeekMeals<TData = Awaited<ReturnType<typeof getThisWeekMeals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getThisWeekMeals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List AI conversations
 */
export declare const getListOpenaiConversationsUrl: () => string;
export declare const listOpenaiConversations: (options?: RequestInit) => Promise<Conversation[]>;
export declare const getListOpenaiConversationsQueryKey: () => readonly ["/api/openai/conversations"];
export declare const getListOpenaiConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listOpenaiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOpenaiConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listOpenaiConversations>>>;
export type ListOpenaiConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List AI conversations
 */
export declare function useListOpenaiConversations<TData = Awaited<ReturnType<typeof listOpenaiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new AI conversation
 */
export declare const getCreateOpenaiConversationUrl: () => string;
export declare const createOpenaiConversation: (createConversationBody: CreateConversationBody, options?: RequestInit) => Promise<Conversation>;
export declare const getCreateOpenaiConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
        data: BodyType<CreateConversationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
    data: BodyType<CreateConversationBody>;
}, TContext>;
export type CreateOpenaiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createOpenaiConversation>>>;
export type CreateOpenaiConversationMutationBody = BodyType<CreateConversationBody>;
export type CreateOpenaiConversationMutationError = ErrorType<unknown>;
/**
 * @summary Create a new AI conversation
 */
export declare const useCreateOpenaiConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
        data: BodyType<CreateConversationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, {
    data: BodyType<CreateConversationBody>;
}, TContext>;
export declare const getListOpenaiConversationMessagesUrl: (id: number) => string;
export declare const listOpenaiConversationMessages: (id: number, options?: RequestInit) => Promise<Message[]>;
export declare const getListOpenaiConversationMessagesQueryKey: (id: number) => readonly [`/api/openai/conversations/${number}/messages`];
export declare const getListOpenaiConversationMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listOpenaiConversationMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversationMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversationMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOpenaiConversationMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listOpenaiConversationMessages>>>;
export type ListOpenaiConversationMessagesQueryError = ErrorType<unknown>;
export declare function useListOpenaiConversationMessages<TData = Awaited<ReturnType<typeof listOpenaiConversationMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpenaiConversationMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendOpenaiMessageUrl: (id: number) => string;
export declare const sendOpenaiMessage: (id: number, sendOpenaiMessageBody: SendOpenaiMessageBody, options?: RequestInit) => Promise<string>;
export declare const getSendOpenaiMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
        id: number;
        data: BodyType<SendOpenaiMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
    id: number;
    data: BodyType<SendOpenaiMessageBody>;
}, TContext>;
export type SendOpenaiMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendOpenaiMessage>>>;
export type SendOpenaiMessageMutationBody = BodyType<SendOpenaiMessageBody>;
export type SendOpenaiMessageMutationError = ErrorType<unknown>;
export declare const useSendOpenaiMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
        id: number;
        data: BodyType<SendOpenaiMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendOpenaiMessage>>, TError, {
    id: number;
    data: BodyType<SendOpenaiMessageBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map