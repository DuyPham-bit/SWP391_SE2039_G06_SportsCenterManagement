namespace SportsCenterManagement.API.Models
{
    public class MailContent
    {
        public string To { get; set; } = string.Empty;          // Địa chỉ email người nhận
        public string Subject { get; set; } = string.Empty;     // Tiêu đề email
        public string Body { get; set; } = string.Empty;        // Nội dung email (có thể chứa HTML)
    }
}
