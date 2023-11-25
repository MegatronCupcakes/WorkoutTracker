FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY WorkoutTracker.csproj .
RUN dotnet restore WorkoutTracker.csproj
COPY . .
RUN dotnet build WorkoutTracker.csproj -c Release -o /app/build

FROM build AS publish
RUN dotnet publish WorkoutTracker.csproj -c Release -o /app/publish

FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html
COPY --from=publish /app/publish/wwwroot .
COPY nginx.conf /etc/nginx/nginx.conf
