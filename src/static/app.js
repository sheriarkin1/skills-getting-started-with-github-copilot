document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list HTML if any
        let participantsHtml = "<p><strong>Participants:</strong></p>";
        if (details.participants && details.participants.length > 0) {
          participantsHtml += '<ul class="participants-list">';
          details.participants.forEach(email => {
            // include delete icon with data attributes
            participantsHtml += `<li>${email} <span class="remove-participant" data-email="${email}" data-activity="${name}">✖</span></li>`;
          });
          participantsHtml += '</ul>';
        } else {
          participantsHtml += '<p class="no-participants">No one has signed up yet.</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // after rendering, wire up delete icons
      attachRemoveHandlers();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);

      // refresh list to update participants and icons
      fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // delegate removal clicks later by re-fetching; but also capture clicks after each fetch

  // helper: add listeners to remove icons
  function attachRemoveHandlers() {
    document.querySelectorAll('.remove-participant').forEach(el => {
      el.addEventListener('click', async (event) => {
        const email = event.target.dataset.email;
        const activity = event.target.dataset.activity;

        try {
          const resp = await fetch(
            `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
            { method: 'DELETE' }
          );
          const resjson = await resp.json();
          if (resp.ok) {
            messageDiv.textContent = resjson.message;
            messageDiv.className = 'success';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            fetchActivities();
          } else {
            messageDiv.textContent = resjson.detail || 'Unable to remove participant';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
          }
        } catch (e) {
          messageDiv.textContent = 'Failed to remove participant.';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
          console.error('Error removing participant:', e);
        }
      });
    });
  }

});
