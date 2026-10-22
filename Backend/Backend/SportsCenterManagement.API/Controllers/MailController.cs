using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.API.Services;

namespace SportsCenterManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MailController : ControllerBase
    {
        private readonly ISendMailService _sendMailService;

        public MailController(ISendMailService sendMailService)
        {
            _sendMailService = sendMailService;
        }

        [HttpPost("send")]
        [AllowAnonymous]
        public async Task<IActionResult> TestSendMail([FromBody] MailContent? request = null)
        {
            var content = (request != null && !string.IsNullOrWhiteSpace(request.To))
                ? request
                : new MailContent
                {
                    To = "recipient-email@gmail.com",
                    Subject = "Kiểm tra xác thực & Gửi mail ASP.NET Core",
                    Body = "<h1>Chào bạn!</h1><p>Email này được gửi từ dịch vụ <b>SendMailService</b> bằng MailKit.</p>"
                };

            string result = await _sendMailService.SendMailAsync(content);
            return Ok(new { message = result });
        }
    }
}
