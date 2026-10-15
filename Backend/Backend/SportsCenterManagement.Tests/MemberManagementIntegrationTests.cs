using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MembersRequests = SportsCenterManagement.BLL.DTOs.Members.Requests;
using MembersResponses = SportsCenterManagement.BLL.DTOs.Members.Responses;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class MemberManagementIntegrationTests
{
    [Fact]
    public async Task CenterUpdateRequiresAssignedManagerEvenWhenActorOwnsMemberProfile()
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "member@test.local");

        using var response = await client.PatchAsJsonAsync("/api/centers/1/members/1", new
        {
            fullName = "Unauthorized change",
            phone = "0987654321",
            dateOfBirth = "2000-01-02",
            gender = "Other",
            address = "Unauthorized address"
        });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var memberService = scope.ServiceProvider.GetRequiredService<IMemberService>();
        var request = new MembersRequests.UpdateMemberAtCenterRequest(
            "Unauthorized change",
            "0987654321",
            new DateOnly(2000, 1, 2),
            "Other",
            "Unauthorized address");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            memberService.UpdateAtCenterAsync(10, 1, 1, request));

        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        db.ChangeTracker.Clear();
        var savedProfile = await db.MemberProfiles.AsNoTracking().SingleAsync(item => item.Id == 1);
        Assert.Equal("Member", savedProfile.FullName);
        Assert.NotEqual("Unauthorized address", savedProfile.Address);
    }

    [Fact]
    public async Task ManagerUpdatesEditableFieldsButCannotOverpostEmail()
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var updated = await client.PatchAsJsonAsync("/api/centers/1/members/1", new
        {
            fullName = "Member Updated",
            phone = "0999999999",
            dateOfBirth = "2000-01-02",
            gender = "Other",
            address = "Updated address"
        });

        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var profile = await updated.Content.ReadFromJsonAsync<MembersResponses.MemberProfileResponse>();
        Assert.NotNull(profile);
        Assert.Equal("member@test.local", profile.Email);
        Assert.Equal("Member Updated", profile.FullName);
        Assert.Equal("0999999999", profile.Phone);

        using var overposted = await client.PatchAsJsonAsync("/api/centers/1/members/1", new
        {
            fullName = "Should not be saved",
            email = "changed-by-manager@test.local",
            phone = "0987654321",
            dateOfBirth = "2000-01-02",
            gender = "Other",
            address = "Overposted address"
        });

        Assert.Equal(HttpStatusCode.BadRequest, overposted.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        var user = await db.Users.AsNoTracking().SingleAsync(item => item.Id == 10);
        var savedProfile = await db.MemberProfiles.AsNoTracking().SingleAsync(item => item.Id == 1);
        Assert.Equal("member@test.local", user.Email);
        Assert.Equal("0999999999", user.Phone);
        Assert.Equal("Member Updated", savedProfile.FullName);
        Assert.Equal("Updated address", savedProfile.Address);
    }

    [Fact]
    public async Task SearchSortsActiveMembersByNameBeforeDisabledMembersAcrossPages()
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");
        await SeedMembers(factory,
            (1011, 1011, "active-bella", "Bella", "Active"),
            (1012, 1012, "disabled-aaron", "Aaron", "Disabled"),
            (1013, 1013, "active-zulu", "Zulu", "Active"),
            (1014, 1014, "disabled-zebra", "Zebra", "Disabled"),
            (1015, 1015, "active-bella-2", "Bella", "Active"));

        const int pageSize = 3;
        var allItems = new List<MembersResponses.MemberProfileResponse>();
        var page = 1;
        int totalCount;
        do
        {
            using var response = await client.GetAsync($"/api/centers/1/members?page={page}&pageSize={pageSize}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<MembersResponses.PagedResponse<MembersResponses.MemberProfileResponse>>();
            Assert.NotNull(result);
            totalCount = result.TotalCount;
            allItems.AddRange(result.Items);
            page += 1;
        } while (allItems.Count < totalCount);

        var firstNonActive = allItems.FindIndex(item => item.AccountStatus != "Active");
        Assert.True(firstNonActive > pageSize, "The status boundary should be proven across more than one page.");
        Assert.All(allItems.Take(firstNonActive), item => Assert.Equal("Active", item.AccountStatus));
        Assert.All(allItems.Skip(firstNonActive), item => Assert.NotEqual("Active", item.AccountStatus));
        Assert.Equal(
            ["Bella", "Bella", "Zulu", "Aaron", "Zebra"],
            allItems.Where(item => item.MemberId is >= 1011 and <= 1015).Select(item => item.FullName));
        Assert.Equal(
            [1011L, 1015L],
            allItems.Where(item => item.FullName == "Bella").Select(item => item.MemberId));
    }

    private static async Task SeedMembers(
        BranchApiFactory factory,
        params (long UserId, long MemberId, string Username, string FullName, string Status)[] members)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        foreach (var member in members)
        {
            db.Users.Add(new User
            {
                Id = member.UserId,
                RoleId = 4,
                Username = member.Username,
                Email = $"{member.Username}@test.local",
                PasswordHash = "not-used",
                Status = member.Status
            });
            db.MemberProfiles.Add(new MemberProfile
            {
                Id = member.MemberId,
                UserId = member.UserId,
                CenterId = 1,
                MemberCode = $"MB{member.MemberId}",
                FullName = member.FullName
            });
        }
        await db.SaveChangesAsync();
    }
}
