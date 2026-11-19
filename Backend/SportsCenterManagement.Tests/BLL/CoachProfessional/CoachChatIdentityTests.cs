using SportsCenterManagement.BLL.DTOs.CoachProfessional;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Common;

namespace SportsCenterManagement.Tests.BLL.CoachProfessional;

/// <summary>
/// A coach appointed from a member account keeps a member profile. Chat must still treat that user as
/// the coach of the thread (it used to fail with "Bạn không thuộc phạm vi trao đổi với HLV này").
/// </summary>
public sealed class CoachChatIdentityTests
{
    private const long CoachUserId = 20;
    private const long StudentUserId = 40;

    [Fact]
    public async Task CoachWhoAlsoHasAMemberProfile_CanReadAndSendInOwnThread()
    {
        using var db = TestDb.Create();
        var (coachId, studentId) = Seed(db);
        var service = new CoachProfessionalService(new UnitOfWork(db), TimeProvider.System);

        var messageId = await service.SendMessage(CoachUserId, new SendCoachMessageRequest(coachId, studentId, "Chào em"), default);
        await service.Messages(CoachUserId, coachId, studentId, default);

        Assert.True(messageId > 0);
        Assert.Equal(CoachUserId, db.CoachMessages.Single().SenderUserId);
    }

    [Fact]
    public async Task StudentCanStillReplyToTheCoach()
    {
        using var db = TestDb.Create();
        var (coachId, studentId) = Seed(db);
        var service = new CoachProfessionalService(new UnitOfWork(db), TimeProvider.System);

        await service.SendMessage(StudentUserId, new SendCoachMessageRequest(coachId, studentId, "Dạ em chào thầy"), default);

        Assert.Equal(StudentUserId, db.CoachMessages.Single().SenderUserId);
    }

    private static (long CoachId, long StudentId) Seed(SportsCenterDbContext db)
    {
        db.Users.AddRange(
            new User { Id = CoachUserId, Username = "coach", Email = "coach@test.vn", PasswordHash = "x", Status = "Active", RoleId = 3 },
            new User { Id = StudentUserId, Username = "student", Email = "student@test.vn", PasswordHash = "x", Status = "Active", RoleId = 5 });
        var coach = new CoachProfile { UserId = CoachUserId, CenterId = 1, CoachCode = "CO20", FullName = "Tran Van Huan", Status = "Active" };
        // The coach's leftover member profile from before the appointment.
        var coachAsMember = new MemberProfile { UserId = CoachUserId, CenterId = 1, MemberCode = "MB15", FullName = "Tran Van Huan", CreatedAt = TestDb.Now };
        var student = new MemberProfile { UserId = StudentUserId, CenterId = 1, MemberCode = "MB40", FullName = "Học viên", CreatedAt = TestDb.Now };
        var cls = new ClassEntity { CenterId = 1, Name = "Cầu lông", Status = "Published", Capacity = 16, DurationMinutes = 90 };
        db.AddRange(coach, coachAsMember, student, cls);
        db.SaveChanges();
        db.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true });
        db.Add(new ClassEnrollment { ClassId = cls.Id, MemberId = student.Id, Status = "Confirmed" });
        db.SaveChanges();
        return (coach.Id, student.Id);
    }
}
