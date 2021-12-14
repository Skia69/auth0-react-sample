import React, { useState, useEffect, useRef } from "react";

import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [userMetadata, setUserMetadata] = useState(null);
  const formRef = useRef();

  const { name, picture, email } = user;

  //Fetch user_metadata
  useEffect(() => {
    const getUserMetadata = async () => {
      const domain = "dev-wcwybeid.us.auth0.com";

      try {
        const accessToken = await getAccessTokenSilently({
          audience: `https://${domain}/api/v2/`,
          scope: "read:current_user",
          ignoreCache: true,
        });

        const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;

        const metadataResponse = await fetch(userDetailsByIdUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const { user_metadata } = await metadataResponse.json();

        setUserMetadata(user_metadata);
      } catch (e) {
        console.log(e.message);
      }
    };

    getUserMetadata();
  }, [getAccessTokenSilently, user && user.sub]);

  //Update user_metadata
  const updateUserMetadata = async (e) => {
    e.preventDefault();
    const { metadata } = formRef.current;

    const domain = "dev-wcwybeid.us.auth0.com";

    try {
      const accessToken = await getAccessTokenSilently({
        audience: `https://${domain}/api/v2/`,
        scope: "update:current_user_metadata",
        ignoreCache: true,
      });

      const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;

      const { user_metadata } = await (
        await fetch(userDetailsByIdUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_metadata: { formMetadata: metadata.value },
          }),
        })
      ).json();

      setUserMetadata(user_metadata);
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <div>
      <div className="row align-items-center profile-header">
        <div className="col-md-2 mb-3">
          <img
            src={picture}
            alt="Profile"
            className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
          />
        </div>
        <div className="col-md text-center text-md-left">
          <h2>{name}</h2>
          <p className="lead text-muted">{email}</p>
        </div>
      </div>
      <div className="row">
        <pre className="col-12 text-light bg-dark p-4">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      {userMetadata ? (
        <div className="row">
          <pre className="col-12 text-light bg-dark p-4">
            {JSON.stringify(userMetadata, null, 2)}
          </pre>
        </div>
      ) : (
        "This user has no metadata"
      )}
      <form onSubmit={updateUserMetadata} ref={formRef}>
        <label>
          <span>New metadata</span>
          <input type="text" name="metadata" />
        </label>
        <button type="submit">Update Metadata</button>
      </form>
    </div>
  );
};

export default Profile;
