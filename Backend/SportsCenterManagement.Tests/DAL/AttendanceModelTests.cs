using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.Tests.DAL;

public sealed class AttendanceModelTests
{
    [Fact]
    public void Attendance_UsesUniqueSessionMemberBusinessKey()
    {
        using var db = TestDb.Create();

        var index = db.Model.FindEntityType(typeof(Attendance))!
            .GetIndexes()
            .Single(candidate => candidate.Properties.Select(property => property.Name)
                .SequenceEqual([nameof(Attendance.SessionId), nameof(Attendance.MemberId)]));

        Assert.True(index.IsUnique);
    }
}
