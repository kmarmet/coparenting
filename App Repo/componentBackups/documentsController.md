        /*  using (HttpClient client = new HttpClient()) {
              var bucket = _configuration.GetValue<string>("DocumentStorageBucket");

              FirebaseStorage storage = new(bucket);
              var url = await storage.Child("documents").Child(currentUserId).Child(fileName).GetDownloadUrlAsync();
              var currentDirectory = Directory.GetCurrentDirectory();
              var path = $"{currentDirectory}/docs/{fileName}";
              string extension = Path.GetExtension(fileName);
              client.DefaultRequestHeaders.Add("X-API-KEY", $"{apiKey}");

              Directory.CreateDirectory($"{currentDirectory}/docs");


              // Download File
              var fileResult = await client.GetAsync(url);
              using (var fs = new FileStream(path, FileMode.CreateNew, FileAccess.ReadWrite)) {
                  await fileResult.Content.CopyToAsync(fs);
              }

              // Convert
              using (MultipartFormDataContent content = new MultipartFormDataContent()) {
                  content.Add(new ByteArrayContent(System.IO.File.ReadAllBytes(path)), "file", string.Concat(Guid.NewGuid(), extension));
                  content.Add(new StringContent("docx"), "format");
                  response = client.PostAsync("https://techhk.aoscdn.com/api/tasks/document/ocr", content).Result.Content.ReadAsStringAsync().Result;
                  JObject json = JObject.Parse(response);
                  taskId = json?.SelectToken("data.task_id").ToString();
                  string fileUrl = Retry(taskId, "imageToHtml");

                  if (taskId != null && taskId.Length > 0) {
                      var result = client.GetAsync($"{fileUrl}/{taskId}").Result.Content.ReadAsStringAsync().Result;
                      Console.WriteLine(result);
                  }
              }
              client.Dispose();

              //System.IO.File.Delete(path);
              Directory.Delete($"{currentDirectory}/docs", true);

          }

          return htmlResult;*/